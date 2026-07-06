import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'blockpass_contract/target/**',
      'public/contracts/*.wasm',
      'eslint.config.mjs',
    ],
  },
  ...nextVitals,
  {
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      '@next/next/no-img-element': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]
