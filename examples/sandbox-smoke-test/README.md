# Sandbox Endpoint Exercise

Small local consumer project for exercising `@wahya/flutterwave-v4-node-sdk` against Flutterwave sandbox.

## Setup

1. Copy `.env.example` to `.env` and fill in your Flutterwave sandbox credentials.
2. Install dependencies:

```bash
npm install
```

3. Run the endpoint exercise:

```bash
npm run test:sandbox
```

## Behavior

- Defaults to `FLW_ENVIRONMENT=sandbox`.
- Runs a staged endpoint exercise with pass/skip/fail output for the SDK resources.
- Read-only endpoints run by default.
- Write calls are disabled unless `FLW_RUN_WRITE_TESTS=true`.
- Card payment-method coverage is optional and requires `FLW_ENCRYPTION_KEY`.
- Steps that need unavailable sandbox state are marked as skipped instead of crashing the whole run.
- The script exits non-zero when an endpoint call fails unexpectedly.
- Non-sandbox execution is blocked unless `FLW_ALLOW_NON_SANDBOX=true`.

## Covered Resources

- `banks`: list, branches, account resolve
- `mobileNetworks`: list
- `wallets`: balances, single balance, statement, optional wallet resolve
- `fees`: quote retrieval
- `customers`: list, create, get, search, update
- `paymentMethods`: list, create, get, optional card create
- `transferRecipients`: list, create, get, delete
- `transferSenders`: list, create, get, delete
- `transferRates`: create, get
- `transfers`: list, create, get, conditional update/retry
- `directTransfers`: create
- `settlements`: list, conditional get
- `charges`: list, create, get, conditional update
- `orders`: list, create, get, conditional update
- `orchestration`: direct charge and direct order
- `virtualAccounts`: list, create, get, update
- `refunds`: list, conditional create/get
- `chargebacks`: list, conditional create/get/update

Some endpoints remain conditional because Flutterwave only allows them for specific lifecycle states or after prerequisite artifacts exist in the sandbox account.

## Environment Variables

- `FLW_CLIENT_ID`: Flutterwave OAuth client ID.
- `FLW_CLIENT_SECRET`: Flutterwave OAuth client secret.
- `FLW_ENVIRONMENT`: `sandbox` or `production`. Defaults to `sandbox`.
- `FLW_TEST_COUNTRY`: Optional country filter for banks and mobile networks. Defaults to `NG`.
- `FLW_TEST_CURRENCY`: Optional currency filter for banks. Defaults to `NGN`.
- `FLW_TEST_BANK_CODE`: Sandbox bank code used for account resolution and payout examples. Defaults to `044`.
- `FLW_TEST_ACCOUNT_NUMBER`: Sandbox account number used for account resolution and payout examples. Defaults to `0690000031`.
- `FLW_TEST_AMOUNT`: Amount used for quotes, transfers, charges, orders, and virtual accounts. Defaults to `1000`.
- `FLW_TEST_WALLET_IDENTIFIER`: Optional wallet identifier for `wallets.resolveAccount()`.
- `FLW_ENCRYPTION_KEY`: Optional Flutterwave encryption key for encrypted card-payment examples.
- `FLW_RUN_WRITE_TESTS`: Set to `true` to create sandbox records and attempt write endpoints.
- `FLW_ALLOW_NON_SANDBOX`: Set to `true` if you explicitly want to run outside sandbox.