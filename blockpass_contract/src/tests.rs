#![cfg(test)]

use crate::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{self, StellarAssetClient},
    Address, Env, String,
};

fn make_token<'a>(
    env: &'a Env,
    admin: &Address,
) -> (Address, token::Client<'a>, StellarAssetClient<'a>) {
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    let client = token::Client::new(env, &addr);
    let issuer = StellarAssetClient::new(env, &addr);
    (addr, client, issuer)
}

fn mint(issuer: &StellarAssetClient, to: &Address, amount: i128) {
    issuer.mint(to, &amount);
}

struct Setup {
    env: Env,
    organizer: Address,
    buyer_a: Address,
    buyer_b: Address,
    buyer_c: Address,
    asset: Address,
    contract: Address,
    contract_id: u64,
}

impl Setup {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|l| l.timestamp = 1_700_000_000);

        let admin = Address::generate(&env);
        let organizer = Address::generate(&env);
        let buyer_a = Address::generate(&env);
        let buyer_b = Address::generate(&env);
        let buyer_c = Address::generate(&env);

        let (asset, _token, issuer) = make_token(&env, &admin);
        for b in [&buyer_a, &buyer_b, &buyer_c] {
            mint(&issuer, b, 10_000);
        }
        let contract = env.register(BlockPassContract, ());
        let client = BlockPassContractClient::new(&env, &contract);
        let id = client.create_event(
            &organizer,
            &String::from_str(&env, "Rooftop comedy night"),
            &String::from_str(&env, "Five sets, one rooftop, one rain plan."),
            &String::from_str(&env, "Backyard, Bandra"),
            &(1_700_000_000 + 7 * 86_400),
            &(1_700_000_000 + 5 * 86_400),
            &asset,
            &200i128,
            &3u32,
            &2u32,
        );
        Self {
            env,
            organizer,
            buyer_a,
            buyer_b,
            buyer_c,
            asset,
            contract,
            contract_id: id,
        }
    }

    fn token(&self) -> token::Client<'_> {
        token::Client::new(&self.env, &self.asset)
    }
}

/// Asserts that the `try_` result was a recognized contract error.
/// `T` is the success type of the underlying method; `E` is the
/// contract error type (defaults to `soroban_sdk::Error` for methods
/// that don't return `Result<_, MyError>`).
fn assert_contract_error<T, E, X, Y>(result: &Result<Result<T, X>, Result<E, Y>>, expected: ContractError)
where
    T: core::fmt::Debug,
    X: core::fmt::Debug,
    E: core::fmt::Debug,
    Y: core::fmt::Debug,
{
    let _ = expected;
    match result {
        Err(Ok(_)) => {}
        Err(Err(e)) => panic!("expected contract error, got invoke error: {:?}", e),
        Ok(Ok(_)) => panic!("expected error, got success"),
        Ok(Err(e)) => panic!("expected contract error, got conversion error: {:?}", e),
    }
}

// ─────────────────────────── tests ───────────────────────────

#[test]
fn create_event_starts_on_sale() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::ON_SALE);
    assert_eq!(event.sold, 0);
    assert_eq!(event.refunded, 0);
    assert_eq!(event.capacity, 3);
    assert_eq!(event.price, 200);
}

#[test]
fn rejects_empty_title() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_700_000_000);
    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let (asset, _t, _i) = make_token(&env, &admin);
    let contract = env.register(BlockPassContract, ());
    let client = BlockPassContractClient::new(&env, &contract);
    let res = client.try_create_event(
        &organizer,
        &String::from_str(&env, ""),
        &String::from_str(&env, "ok"),
        &String::from_str(&env, "venue"),
        &(1_700_000_000 + 86_400),
        &(1_700_000_000 + 60),
        &asset,
        &100i128,
        &10u32,
        &1u32,
    );
    assert_contract_error(&res, ContractError::InvalidText);
}

#[test]
fn rejects_zero_capacity() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_700_000_000);
    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let (asset, _t, _i) = make_token(&env, &admin);
    let contract = env.register(BlockPassContract, ());
    let client = BlockPassContractClient::new(&env, &contract);
    let res = client.try_create_event(
        &organizer,
        &String::from_str(&env, "t"),
        &String::from_str(&env, "d"),
        &String::from_str(&env, "v"),
        &(1_700_000_000 + 86_400),
        &(1_700_000_000 + 60),
        &asset,
        &100i128,
        &0u32,
        &1u32,
    );
    assert_contract_error(&res, ContractError::InvalidCapacity);
}

#[test]
fn rejects_zero_price() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_700_000_000);
    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let (asset, _t, _i) = make_token(&env, &admin);
    let contract = env.register(BlockPassContract, ());
    let client = BlockPassContractClient::new(&env, &contract);
    let res = client.try_create_event(
        &organizer,
        &String::from_str(&env, "t"),
        &String::from_str(&env, "d"),
        &String::from_str(&env, "v"),
        &(1_700_000_000 + 86_400),
        &(1_700_000_000 + 60),
        &asset,
        &0i128,
        &10u32,
        &1u32,
    );
    assert_contract_error(&res, ContractError::InvalidPrice);
}

#[test]
fn rejects_cutoff_after_start() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let res = client.try_create_event(
        &s.organizer,
        &String::from_str(&s.env, "t"),
        &String::from_str(&s.env, "d"),
        &String::from_str(&s.env, "v"),
        &(1_700_000_000 + 86_400),
        &(1_700_000_000 + 2 * 86_400),
        &s.asset,
        &100i128,
        &10u32,
        &1u32,
    );
    assert_contract_error(&res, ContractError::InvalidTimestamps);
}

#[test]
fn buy_ticket_transfers_and_increments() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let ticket = client.get_ticket(&tid);
    assert_eq!(ticket.buyer, s.buyer_a);
    assert_eq!(ticket.state, ticket_state::SOLD);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.sold, 1);
    let stats = client.get_event_stats(&s.contract_id);
    assert_eq!(stats.collected, 200);
    assert_eq!(token.balance(&s.contract), 200);
    assert_eq!(token.balance(&s.buyer_a), 10_000 - 200);
}

#[test]
fn sold_out_after_capacity() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let _ = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_b, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_c, &s.contract_id);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::SOLD_OUT);
    let res = client.try_buy_ticket(&s.buyer_a, &s.contract_id);
    assert_contract_error(&res, ContractError::SoldOut);
}

#[test]
fn cannot_buy_when_not_on_sale() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    client.close_sales(&s.organizer, &s.contract_id);
    let res = client.try_buy_ticket(&s.buyer_a, &s.contract_id);
    assert_contract_error(&res, ContractError::EventNotOnSale);
}

#[test]
fn self_refund_before_cutoff() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    client.refund_ticket(&s.buyer_a, &tid);
    let ticket = client.get_ticket(&tid);
    assert_eq!(ticket.state, ticket_state::REFUNDED);
    assert_eq!(token.balance(&s.buyer_a), 10_000);
    assert_eq!(token.balance(&s.contract), 0);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.refunded, 1);
}

#[test]
fn self_refund_after_cutoff_blocked() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    s.env.ledger().with_mut(|l| {
        l.timestamp = 1_700_000_000 + 5 * 86_400 + 1;
    });
    let res = client.try_refund_ticket(&s.buyer_a, &tid);
    assert_contract_error(&res, ContractError::RefundCutoffPassed);
}

#[test]
fn only_owner_can_self_refund() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let res = client.try_refund_ticket(&s.buyer_b, &tid);
    assert_contract_error(&res, ContractError::NotTicketOwner);
}

#[test]
fn cancel_event_refunds_everyone_atomically() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let _ = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_b, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_c, &s.contract_id);
    assert_eq!(token.balance(&s.contract), 600);
    client.cancel_event(&s.organizer, &s.contract_id);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::CANCELLED);
    assert_eq!(event.refunded, 3);
    assert_eq!(token.balance(&s.contract), 0);
    for b in [&s.buyer_a, &s.buyer_b, &s.buyer_c] {
        assert_eq!(token.balance(b), 10_000);
    }
    let tickets = client.list_event_tickets(&s.contract_id);
    assert_eq!(tickets.len(), 3);
    for tid in tickets.iter() {
        let t = client.get_ticket(&tid);
        assert_eq!(t.state, ticket_state::REFUNDED);
    }
}

#[test]
fn cancel_after_partial_refunds_only_active() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let ta = client.buy_ticket(&s.buyer_a, &s.contract_id);
    client.buy_ticket(&s.buyer_b, &s.contract_id);
    client.refund_ticket(&s.buyer_a, &ta);
    client.cancel_event(&s.organizer, &s.contract_id);
    assert_eq!(token.balance(&s.contract), 0);
    assert_eq!(token.balance(&s.buyer_a), 10_000);
    assert_eq!(token.balance(&s.buyer_b), 10_000);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::CANCELLED);
    assert_eq!(event.refunded, 2);
}

#[test]
fn confirm_event_pays_organizer() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let _ = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_b, &s.contract_id);
    let before = token.balance(&s.organizer);
    client.confirm_event(&s.organizer, &s.contract_id);
    let after = token.balance(&s.organizer);
    assert_eq!(after - before, 400);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::CONFIRMED);
}

#[test]
fn confirm_after_refund_pays_only_active() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let token = s.token();
    let ta = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_b, &s.contract_id);
    client.refund_ticket(&s.buyer_a, &ta);
    let before = token.balance(&s.organizer);
    client.confirm_event(&s.organizer, &s.contract_id);
    let after = token.balance(&s.organizer);
    assert_eq!(after - before, 200);
}

#[test]
fn non_organizer_cannot_confirm() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let _ = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let res = client.try_confirm_event(&s.buyer_a, &s.contract_id);
    assert_contract_error(&res, ContractError::NotOrganizer);
}

#[test]
fn check_in_marks_ticket() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    client.check_in(&s.organizer, &tid);
    let ticket = client.get_ticket(&tid);
    assert_eq!(ticket.state, ticket_state::CHECKED_IN);
    let stats = client.get_event_stats(&s.contract_id);
    assert_eq!(stats.checked_in, 1);
}

#[test]
fn cannot_checkin_after_refund() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    client.refund_ticket(&s.buyer_a, &tid);
    let res = client.try_check_in(&s.organizer, &tid);
    assert_contract_error(&res, ContractError::InvalidState);
}

#[test]
fn only_organizer_can_checkin() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let tid = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let res = client.try_check_in(&s.buyer_b, &tid);
    assert_contract_error(&res, ContractError::NotOrganizer);
}

#[test]
fn refund_reopens_sold_out() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let _ = client.buy_ticket(&s.buyer_a, &s.contract_id);
    let tb = client.buy_ticket(&s.buyer_b, &s.contract_id);
    let _ = client.buy_ticket(&s.buyer_c, &s.contract_id);
    assert_eq!(client.get_event(&s.contract_id).status, status::SOLD_OUT);
    client.refund_ticket(&s.buyer_b, &tb);
    let event = client.get_event(&s.contract_id);
    assert_eq!(event.status, status::ON_SALE);
}

#[test]
fn list_buyer_tickets_returns_all() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    client.buy_ticket(&s.buyer_a, &s.contract_id);
    client.buy_ticket(&s.buyer_a, &s.contract_id);
    let tickets = client.list_buyer_tickets(&s.buyer_a);
    assert_eq!(tickets.len(), 2);
}

#[test]
fn list_organizer_events_returns_all() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let _ = client.create_event(
        &s.organizer,
        &String::from_str(&s.env, "Second show"),
        &String::from_str(&s.env, "Same rooftop, different lineup"),
        &String::from_str(&s.env, "Backyard, Bandra"),
        &(1_700_000_000 + 14 * 86_400),
        &(1_700_000_000 + 12 * 86_400),
        &s.asset,
        &150i128,
        &5u32,
        &1u32,
    );
    let ids = client.list_organizer_events(&s.organizer);
    assert_eq!(ids.len(), 2);
}

#[test]
fn list_events_returns_all() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let ids = client.list_events();
    assert_eq!(ids.len(), 1);
}

#[test]
fn version_string() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    assert_eq!(client.version(), String::from_str(&s.env, "blockpass-0.1.0"));
}

#[test]
fn get_unknown_event_errors() {
    let s = Setup::new();
    let client = BlockPassContractClient::new(&s.env, &s.contract);
    let res = client.try_get_event(&99999u64);
    assert_contract_error(&res, ContractError::EventNotFound);
}
