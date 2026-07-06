#![no_std]
#![allow(deprecated)]

//! # BlockPass — Soroban Contract
//!
//! Collects ticket money for a small event and atomically refunds all
//! buyers if the organizer cancels. Built on top of the Stellar Asset
//! Contract (SAC): the contract itself holds the funds, and tickets are
//! transferred in/out via `token::Client::transfer`.
//!
//! Lifecycle of an event:
//!   Draft -> OnSale -> SoldOut (optional) -> Confirmed | Cancelled | Refunded
//!
//! Tickets:
//!   Sold -> CheckedIn | Refunded
//!
//! Error model: a `ContractError` enum exposed to clients, with a
//! dedicated `error` symbol so wallets can render a friendly message.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, token,
    Address, Env, IntoVal, String, Symbol, Vec,
};

// ───────────────────────── constants ─────────────────────────

const DAY_IN_LEDGERS: u32 = 17_280;
const INSTANCE_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS * 30;
const INSTANCE_BUMP_AMOUNT: u32 = DAY_IN_LEDGERS * 31;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = DAY_IN_LEDGERS * 30;
const PERSISTENT_BUMP_AMOUNT: u32 = DAY_IN_LEDGERS * 31;

// Maximum value of `i128` we accept for a ticket price. Equal to the
// maximum amount a single SAC transfer can carry. Anything higher is
// almost certainly a bug or an attack, so we refuse.
const MAX_TICKET_PRICE: i128 = i128::MAX;

// ─────────────────────────── types ───────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Event {
    pub id: u64,
    pub organizer: Address,
    pub title: String,
    pub description: String,
    pub venue: String,
    /// Unix timestamp at which the event starts (seconds).
    pub starts_at: u64,
    /// Unix timestamp after which buyers can no longer self-refund.
    pub refund_cutoff: u64,
    /// SAC address of the asset used to buy tickets.
    pub asset: Address,
    /// Price of a single ticket, in the asset's smallest unit.
    pub price: i128,
    /// Maximum number of tickets the event can sell.
    pub capacity: u32,
    /// Number of tickets currently in state `Sold` (or `CheckedIn`).
    pub sold: u32,
    /// Number of tickets in state `Refunded` (free seats).
    pub refunded: u32,
    /// Lifecycle state of the event, encoded as a small integer so it
    /// travels cheaply across the wire.
    pub status: u32,
    /// Ledger timestamp at which the event was created.
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Ticket {
    pub id: u64,
    pub event_id: u64,
    pub buyer: Address,
    pub price: i128,
    /// 0 = Sold, 1 = CheckedIn, 2 = Refunded.
    pub state: u32,
    pub bought_at: u64,
    pub checked_in_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventStats {
    pub sold: u32,
    pub refunded: u32,
    pub checked_in: u32,
    pub capacity: u32,
    pub status: u32,
    pub collected: i128,
}

#[contracttype]
pub enum DataKey {
    Event(u64),
    Ticket(u64),
    EventCount,
    TicketCount,
    /// Per-event list of ticket ids in purchase order.
    EventTickets(u64),
    /// Per-buyer global list of ticket ids.
    BuyerTickets(Address),
    /// Per-organizer global list of event ids.
    OrganizerEvents(Address),
}

// ─────────────────────────── errors ───────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// Title, description, or venue was empty.
    InvalidText = 1,
    /// `capacity` was zero.
    InvalidCapacity = 2,
    /// `price` was negative or above MAX_TICKET_PRICE.
    InvalidPrice = 3,
    /// `starts_at` is in the past, or `refund_cutoff >= starts_at`.
    InvalidTimestamps = 4,
    /// Caller is not the organizer of the referenced event.
    NotOrganizer = 5,
    /// Event id does not exist.
    EventNotFound = 6,
    /// Ticket id does not exist.
    TicketNotFound = 7,
    /// Event is not in a state that allows ticket purchases.
    EventNotOnSale = 8,
    /// Event is already at capacity.
    SoldOut = 9,
    /// Caller does not own the ticket they are trying to act on.
    NotTicketOwner = 10,
    /// `refund_cutoff` has already passed; self-refund no longer allowed.
    RefundCutoffPassed = 11,
    /// Event is not in a state that allows the requested transition.
    InvalidState = 12,
    /// Arithmetic overflow when adding to a balance.
    Overflow = 13,
    /// The buyer has already used up `max_per_buyer` for this event.
    ExceedsPerBuyerLimit = 14,
    /// `max_per_buyer` was set to zero, which would block all sales.
    InvalidPerBuyerLimit = 15,
}

// ─────────────────────────── events ───────────────────────────

/// Events emitted by the contract. The topic is the symbol `EVENT`
/// followed by a short event name. Data is `()` for now — clients should
/// read state via the `get_*` getters if they need full details.
fn emit(env: &Env, name: Symbol) {
    let topics = (symbol_short!("EVENT"), name);
    env.events().publish(topics, ());
}

// ─────────────────────────── status codes ─────────────────────

pub mod status {
    pub const DRAFT: u32 = 0;
    pub const ON_SALE: u32 = 1;
    pub const SOLD_OUT: u32 = 2;
    pub const CONFIRMED: u32 = 3;
    pub const CANCELLED: u32 = 4;
    pub const REFUNDED: u32 = 5; // fully refunded, all tickets refunded
}

pub mod ticket_state {
    pub const SOLD: u32 = 0;
    pub const CHECKED_IN: u32 = 1;
    pub const REFUNDED: u32 = 2;
}

// ─────────────────────────── helpers ──────────────────────────

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

fn bump_persistent(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
}

fn bump_persistent_if_exists(env: &Env, key: &DataKey) {
    if env.storage().persistent().get::<_, Vec<u64>>(key).is_some() {
        bump_persistent(env, key);
    }
}

fn get_event(env: &Env, event_id: u64) -> Event {
    env.storage()
        .persistent()
        .get(&DataKey::Event(event_id))
        .unwrap_or_else(|| panic_with_error!(env, ContractError::EventNotFound))
}

fn get_ticket(env: &Env, ticket_id: u64) -> Ticket {
    env.storage()
        .persistent()
        .get(&DataKey::Ticket(ticket_id))
        .unwrap_or_else(|| panic_with_error!(env, ContractError::TicketNotFound))
}

fn get_event_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::EventCount)
        .unwrap_or(0u64)
}

fn get_ticket_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TicketCount)
        .unwrap_or(0u64)
}

fn set_event_count(env: &Env, count: u64) {
    env.storage().persistent().set(&DataKey::EventCount, &count);
}

fn set_ticket_count(env: &Env, count: u64) {
    env.storage().persistent().set(&DataKey::TicketCount, &count);
}

fn push_event_ticket(env: &Env, event_id: u64, ticket_id: u64) {
    let key = DataKey::EventTickets(event_id);
    let mut list: Vec<u64> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));
    list.push_back(ticket_id);
    env.storage().persistent().set(&key, &list);
    bump_persistent(env, &key);
}

fn push_buyer_ticket(env: &Env, buyer: &Address, ticket_id: u64) {
    let key = DataKey::BuyerTickets(buyer.clone());
    let mut list: Vec<u64> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));
    list.push_back(ticket_id);
    env.storage().persistent().set(&key, &list);
    bump_persistent(env, &key);
}

fn push_organizer_event(env: &Env, organizer: &Address, event_id: u64) {
    let key = DataKey::OrganizerEvents(organizer.clone());
    let mut list: Vec<u64> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env));
    list.push_back(event_id);
    env.storage().persistent().set(&key, &list);
    bump_persistent(env, &key);
}

fn require_organizer(env: &Env, event: &Event, caller: &Address) {
    if &event.organizer != caller {
        panic_with_error!(env, ContractError::NotOrganizer);
    }
    caller.require_auth();
}

fn validate_text(env: &Env, s: &String) {
    if s.is_empty() {
        panic_with_error!(env, ContractError::InvalidText);
    }
}

fn transfer_from_buyer(env: &Env, asset: &Address, buyer: &Address, amount: i128) {
    let client = token::Client::new(env, asset);
    client.transfer(buyer, &env.current_contract_address(), &amount);
}

fn transfer_to(env: &Env, asset: &Address, to: &Address, amount: i128) {
    let client = token::Client::new(env, asset);
    client.transfer(&env.current_contract_address(), to, &amount);
}

fn env_timestamp(env: &Env) -> u64 {
    env.ledger().timestamp()
}

// ─────────────────────────── contract ─────────────────────────

#[contract]
pub struct BlockPassContract;

#[contractimpl]
impl BlockPassContract {
    // ─────────── create_event ───────────

    /// Create a new event in `OnSale` state. The organizer is the only
    /// authorized caller and must provide auth.
    ///
    /// * `max_per_buyer` — cap on tickets one wallet can buy (0 = no cap
    ///   beyond capacity; the literal value 0 is rejected to keep the
    ///   intent clear).
    pub fn create_event(
        env: Env,
        organizer: Address,
        title: String,
        description: String,
        venue: String,
        starts_at: u64,
        refund_cutoff: u64,
        asset: Address,
        price: i128,
        capacity: u32,
        max_per_buyer: u32,
    ) -> u64 {
        organizer.require_auth();

        validate_text(&env, &title);
        validate_text(&env, &venue);
        if description.is_empty() {
            panic_with_error!(&env, ContractError::InvalidText);
        }
        if capacity == 0 {
            panic_with_error!(&env, ContractError::InvalidCapacity);
        }
        if price <= 0 || price > MAX_TICKET_PRICE {
            panic_with_error!(&env, ContractError::InvalidPrice);
        }
        if max_per_buyer == 0 {
            panic_with_error!(&env, ContractError::InvalidPerBuyerLimit);
        }
        let now = env_timestamp(&env);
        if starts_at <= now {
            panic_with_error!(&env, ContractError::InvalidTimestamps);
        }
        if refund_cutoff >= starts_at {
            panic_with_error!(&env, ContractError::InvalidTimestamps);
        }

        let id = get_event_count(&env)
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));

        let event = Event {
            id,
            organizer: organizer.clone(),
            title,
            description,
            venue,
            starts_at,
            refund_cutoff,
            asset,
            price,
            capacity,
            sold: 0,
            refunded: 0,
            status: status::ON_SALE,
            created_at: now,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Event(id), &event);
        set_event_count(&env, id);
        push_organizer_event(&env, &organizer, id);
        bump_persistent(&env, &DataKey::Event(id));
        bump_instance(&env);

        emit(&env, symbol_short!("create"));
        id.into_val(&env)
    }

    // ─────────── open / close sales ───────────

    /// Put a `Draft` event on sale. Kept for completeness — newly
    /// created events are already on sale.
    pub fn open_sales(env: Env, organizer: Address, event_id: u64) {
        let mut event = get_event(&env, event_id);
        require_organizer(&env, &event, &organizer);
        if event.status != status::DRAFT {
            panic_with_error!(&env, ContractError::InvalidState);
        }
        event.status = status::ON_SALE;
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_id), &event);
        bump_persistent(&env, &DataKey::Event(event_id));
        bump_instance(&env);
        emit(&env, symbol_short!("open"));
    }

    /// Manually close sales (e.g. organizer wants to stop selling even
    /// though capacity is not reached). Does not move funds.
    pub fn close_sales(env: Env, organizer: Address, event_id: u64) {
        let mut event = get_event(&env, event_id);
        require_organizer(&env, &event, &organizer);
        if event.status != status::ON_SALE {
            panic_with_error!(&env, ContractError::InvalidState);
        }
        event.status = status::CONFIRMED; // treat close as "frozen for confirm"
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_id), &event);
        bump_persistent(&env, &DataKey::Event(event_id));
        bump_instance(&env);
        emit(&env, symbol_short!("close"));
    }

    // ─────────── buy_ticket ───────────

    /// Buy a single ticket. The buyer must authorize the SAC transfer
    /// for the ticket price.
    pub fn buy_ticket(env: Env, buyer: Address, event_id: u64) -> u64 {
        buyer.require_auth();

        let mut event = get_event(&env, event_id);
        if event.status != status::ON_SALE {
            panic_with_error!(&env, ContractError::EventNotOnSale);
        }
        if event.sold >= event.capacity {
            panic_with_error!(&env, ContractError::SoldOut);
        }

        transfer_from_buyer(&env, &event.asset, &buyer, event.price);

        let ticket_id = get_ticket_count(&env)
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));

        let ticket = Ticket {
            id: ticket_id,
            event_id,
            buyer: buyer.clone(),
            price: event.price,
            state: ticket_state::SOLD,
            bought_at: env_timestamp(&env),
            checked_in_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &ticket);
        set_ticket_count(&env, ticket_id);
        push_event_ticket(&env, event_id, ticket_id);
        push_buyer_ticket(&env, &buyer, ticket_id);

        event.sold = event
            .sold
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));
        if event.sold == event.capacity {
            event.status = status::SOLD_OUT;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_id), &event);
        bump_persistent(&env, &DataKey::Event(event_id));
        bump_persistent(&env, &DataKey::Ticket(ticket_id));
        bump_instance(&env);

        emit(&env, symbol_short!("buy"));
        ticket_id.into_val(&env)
    }

    // ─────────── confirm_event ───────────

    /// After the event has happened, the organizer claims the collected
    /// funds. Allowed from `OnSale`, `SoldOut`, or `Confirmed`
    /// (re-entrant idempotent). Refunded tickets' funds are NOT sent to
    /// the organizer; they were already returned via `refund_ticket`
    /// or the batch path.
    pub fn confirm_event(env: Env, organizer: Address, event_id: u64) {
        let mut event = get_event(&env, event_id);
        require_organizer(&env, &event, &organizer);
        match event.status {
            status::ON_SALE | status::SOLD_OUT | status::CONFIRMED => {}
            _ => panic_with_error!(&env, ContractError::InvalidState),
        }

        let active: u32 = event
            .sold
            .checked_sub(event.refunded)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));
        let amount: i128 = (active as i128)
            .checked_mul(event.price)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));
        if amount > 0 {
            transfer_to(&env, &event.asset, &event.organizer, amount);
        }

        event.status = status::CONFIRMED;
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_id), &event);
        bump_persistent(&env, &DataKey::Event(event_id));
        bump_instance(&env);

        emit(&env, symbol_short!("confirm"));
    }

    // ─────────── cancel_event ───────────

    /// Cancel the event and atomically refund every active ticket
    /// holder. Tickets in state `Refunded` are skipped. Soroban
    /// executes the whole function atomically — if any transfer fails,
    /// the whole transaction reverts, which is the behaviour we want.
    pub fn cancel_event(env: Env, organizer: Address, event_id: u64) {
        let mut event = get_event(&env, event_id);
        require_organizer(&env, &event, &organizer);
        match event.status {
            status::ON_SALE | status::SOLD_OUT | status::CONFIRMED => {}
            _ => panic_with_error!(&env, ContractError::InvalidState),
        }

        let key = DataKey::EventTickets(event_id);
        let tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        bump_persistent_if_exists(&env, &key);

        for tid in tickets.iter() {
            let mut ticket = get_ticket(&env, tid);
            if ticket.state == ticket_state::REFUNDED {
                continue;
            }
            transfer_to(&env, &event.asset, &ticket.buyer, ticket.price);
            ticket.state = ticket_state::REFUNDED;
            ticket.checked_in_at = 0;
            env.storage()
                .persistent()
                .set(&DataKey::Ticket(tid), &ticket);
            bump_persistent(&env, &DataKey::Ticket(tid));

            event.refunded = event
                .refunded
                .checked_add(1)
                .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));
        }

        event.status = status::CANCELLED;
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_id), &event);
        bump_persistent(&env, &DataKey::Event(event_id));
        bump_instance(&env);

        emit(&env, symbol_short!("cancel"));
    }

    // ─────────── refund_ticket ───────────

    /// Self-service refund. The ticket's buyer asks for their money
    /// back, and the contract transfers the price back to them. Only
    /// allowed before `refund_cutoff`.
    pub fn refund_ticket(env: Env, buyer: Address, ticket_id: u64) {
        buyer.require_auth();
        let mut ticket = get_ticket(&env, ticket_id);
        if ticket.buyer != buyer {
            panic_with_error!(&env, ContractError::NotTicketOwner);
        }
        if ticket.state != ticket_state::SOLD {
            panic_with_error!(&env, ContractError::InvalidState);
        }
        let event = get_event(&env, ticket.event_id);
        if env_timestamp(&env) >= event.refund_cutoff {
            panic_with_error!(&env, ContractError::RefundCutoffPassed);
        }

        transfer_to(&env, &event.asset, &buyer, ticket.price);
        ticket.state = ticket_state::REFUNDED;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &ticket);
        bump_persistent(&env, &DataKey::Ticket(ticket_id));

        let mut event_mut = event;
        event_mut.refunded = event_mut
            .refunded
            .checked_add(1)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));
        if event_mut.status == status::SOLD_OUT && event_mut.refunded < event_mut.sold {
            event_mut.status = status::ON_SALE;
        }
        env.storage()
            .persistent()
            .set(&DataKey::Event(event_mut.id), &event_mut);
        bump_persistent(&env, &DataKey::Event(event_mut.id));
        bump_instance(&env);

        emit(&env, symbol_short!("refund"));
    }

    // ─────────── check_in ───────────

    /// Mark a ticket as `CheckedIn`. Only the organizer of the event is
    /// allowed to do this. The contract does not validate the QR
    /// payload itself; the server (or the contract owner) signs the QR
    /// token and the UI scans it, then submits the ticket id here.
    pub fn check_in(env: Env, organizer: Address, ticket_id: u64) {
        let mut ticket = get_ticket(&env, ticket_id);
        let event = get_event(&env, ticket.event_id);
        require_organizer(&env, &event, &organizer);
        if ticket.state != ticket_state::SOLD {
            panic_with_error!(&env, ContractError::InvalidState);
        }
        ticket.state = ticket_state::CHECKED_IN;
        ticket.checked_in_at = env_timestamp(&env);
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(ticket_id), &ticket);
        bump_persistent(&env, &DataKey::Ticket(ticket_id));
        bump_instance(&env);
        emit(&env, symbol_short!("checkin"));
    }

    // ─────────── getters ───────────

    pub fn get_event(env: Env, event_id: u64) -> Event {
        let e = get_event(&env, event_id);
        bump_persistent(&env, &DataKey::Event(event_id));
        e
    }

    pub fn get_ticket(env: Env, ticket_id: u64) -> Ticket {
        let t = get_ticket(&env, ticket_id);
        bump_persistent(&env, &DataKey::Ticket(ticket_id));
        t
    }

    pub fn get_event_stats(env: Env, event_id: u64) -> EventStats {
        let e = get_event(&env, event_id);
        bump_persistent(&env, &DataKey::Event(event_id));

        let key = DataKey::EventTickets(event_id);
        let tickets: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        bump_persistent_if_exists(&env, &key);

        let mut checked_in: u32 = 0;
        let mut active_sold: u32 = 0;
        for tid in tickets.iter() {
            let t = get_ticket(&env, tid);
            match t.state {
                ticket_state::SOLD => {
                    active_sold = active_sold
                        .checked_add(1)
                        .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow))
                }
                ticket_state::CHECKED_IN => {
                    checked_in = checked_in
                        .checked_add(1)
                        .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow))
                }
                _ => {}
            }
        }
        let collected: i128 = (active_sold as i128)
            .checked_add(checked_in as i128)
            .and_then(|n| n.checked_mul(e.price))
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::Overflow));

        EventStats {
            sold: e.sold,
            refunded: e.refunded,
            checked_in,
            capacity: e.capacity,
            status: e.status,
            collected,
        }
    }

    pub fn list_event_tickets(env: Env, event_id: u64) -> Vec<u64> {
        let key = DataKey::EventTickets(event_id);
        let list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        bump_persistent_if_exists(&env, &key);
        list
    }

    pub fn list_buyer_tickets(env: Env, buyer: Address) -> Vec<u64> {
        let key = DataKey::BuyerTickets(buyer);
        let list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        bump_persistent_if_exists(&env, &key);
        list
    }

    pub fn list_organizer_events(env: Env, organizer: Address) -> Vec<u64> {
        let key = DataKey::OrganizerEvents(organizer);
        let list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(&env));
        bump_persistent_if_exists(&env, &key);
        list
    }

    // ─────────── version ───────────

    /// Returns a contract version string, used by the UI to surface a
    /// "running contract v…" indicator and by clients to detect drift.
    pub fn version(_env: Env) -> String {
        String::from_str(&_env, "blockpass-0.1.0")
    }
}

// ─────────────────────────── tests ───────────────────────────

#[cfg(test)]
mod tests;
