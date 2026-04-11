# Flutterwave v4 Node SDK

TypeScript SDK for the Flutterwave v4 API, built from a local snapshot of Flutterwave's guides and reference pages.

## Install

```bash
npm install @wahya/flutterwave-v4-node-sdk
```

## Usage

```ts
import { FlutterwaveClient } from '@wahya/flutterwave-v4-node-sdk';

const client = new FlutterwaveClient({
  clientId: process.env.FLW_CLIENT_ID!,
  clientSecret: process.env.FLW_CLIENT_SECRET!,
  environment: 'sandbox',
});

const customers = await client.customers.list({ page: 1, limit: 20 });

const recipient = await client.transferRecipients.create({
  name: 'Ada Lovelace',
  account_number: '0690000037',
  bank_code: '044',
});

await client.transferRecipients.delete(recipient.data.id!);
```

For standard charges and orders, the v4 reference expects stored customer and payment-method IDs. Embedded customer and payment-method payloads are typed on the orchestration resources instead.

```ts
const customer = await client.customers.create({
  email: 'ada@example.com',
  name: {
    first: 'Ada',
    last: 'Lovelace',
  },
});

await client.charges.create({
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
  customer_id: String(customer.data.id),
  payment_method_id: 'pmd_WRq7L4TM8p',
});
```

## Card Flows

Flutterwave confirmed two distinct usage patterns in v4:

- Regular flow: create a customer, save a card as a payment method, then create charges with `customer_id` and `payment_method_id`. This is the better fit for recurring payments and any workflow where you want to reuse saved customer and card details.
- Orchestrator flow: send embedded customer and payment method payloads in one request. This is the better fit for one-time payments where combining several steps is more convenient than managing saved records yourself.

For either flow, inspect the charge or order response for `next_action`. If Flutterwave requires extra customer input such as PIN, OTP, AVS, or 3DS, submit the follow-up authorization payload that matches the returned action.

## Security And Compliance

Direct card processing still carries PCI-DSS obligations. This SDK is designed to help with the Flutterwave-specific parts of that handling, but consumers still need to operate their systems accordingly.

- Never store or log raw card details.
- Only encrypt the sensitive card and PIN fields before sending them to Flutterwave.
- Reuse the same nonce across related encrypted fields in a single request.
- Prefer Flutterwave Inline or hosted checkout if you want card data to avoid your systems entirely.

Flutterwave indicates that v4 is operated with the relevant PCI-DSS, NDPA, and CBN-aligned controls on their side, but SDK consumers are still responsible for secure handling in their own applications.

## Features

- OAuth 2.0 client credentials with cached token refresh
- Sandbox and production environment support
- Automatic `X-Idempotency-Key` handling for `POST` requests
- Automatic `X-Trace-Id` generation
- Typed helpers for card payload encryption and webhook verification
- Resource modules for the documented Flutterwave v4 API surface

## Response Typing

Every resource method resolves to a typed success envelope and throws `FlutterwaveAPIError` for HTTP failures or payloads with `status: 'failed'`.

```ts
import type {
  ChargeResponse,
  FlutterwaveApiResult,
  FlutterwaveErrorResponse,
  FlutterwaveSuccessResponse,
} from '@wahya/flutterwave-v4-node-sdk';

type ChargeSuccess = FlutterwaveSuccessResponse<ChargeResponse['data']>;
type ChargeResult = FlutterwaveApiResult<ChargeResponse['data']>;

function isFailed(result: ChargeResult): result is FlutterwaveErrorResponse {
  return result.status === 'failed';
}
```

The important distinction is:

- SDK calls return `FlutterwaveSuccessResponse<T>` on success.
- Raw payload modelling can use `FlutterwaveApiResult<T>` when you want a discriminated `status: 'success' | 'failed'` union.
- Runtime API failures surface as `FlutterwaveAPIError`, which includes Flutterwave error metadata when available.

## Typed Surface

The package now exports endpoint-specific request and response contracts for the public resources. The highest-signal types are:

- `customers`: `CreateCustomerRequest`, `UpdateCustomerRequest`, `CustomerResponse`, `CustomersListResponse`
- `charges`: `CreateChargeRequest`, `UpdateChargeRequest`, `ChargeResponse`, `ChargesListResponse`
- `orchestration`: `CreateOrchestrationChargeRequest`, `CreateOrchestrationOrderRequest`
- `paymentMethods`: `CreatePaymentMethodRequest`, `PaymentMethodInput`, `PaymentMethodResponse`
- `wallets`: `WalletAccountResolveRequest`, `WalletStatementResponse`, `WalletBalanceResponse`
- `transfers`: `CreateTransferRequest`, `UpdateTransferRequest`, `RetryTransferRequest`, `TransfersListResponse`
- `transferRecipients`: `CreateTransferRecipientRequest`, `TransferRecipientResponse`, `TransferRecipientsListResponse`
- `transferSenders`: `CreateTransferSenderRequest`, `TransferSenderResponse`, `TransferSendersListResponse`
- `chargebacks`: `CreateChargebackRequest`, `UpdateChargebackRequest`, `ChargebackResponse`
- `orders`: `CreateOrderRequest`, `UpdateOrderRequest`, `OrderResponse`
- `virtualAccounts`: `CreateVirtualAccountRequest`, `UpdateVirtualAccountRequest`, `VirtualAccountResponse`

Some list endpoints in the Flutterwave reference are cursor-based rather than plain arrays. Those response types now reflect the saved docs more closely:

- `wallets.getStatement()` returns `data.cursor` and `data.transactions`
- `transfers.list()` returns `data.cursor` and `data.transfers`
- `transferRecipients.list()` returns `data.cursor` and `data.recipients`
- `transferSenders.list()` returns `data.cursor` and `data.senders`

## Available Resources

- `customers`
- `charges`
- `orchestration`
- `paymentMethods`
- `mobileNetworks`
- `banks`
- `wallets`
- `directTransfers`
- `transfers`
- `transferRecipients`
- `transferSenders`
- `transferRates`
- `settlements`
- `chargebacks`
- `refunds`
- `fees`
- `orders`
- `virtualAccounts`

## Helper Utilities

```ts
import {
  encryptPayload,
  verifyWebhookSignature,
  generateIdempotencyKey,
} from '@wahya/flutterwave-v4-node-sdk';
```

For card flows, encrypt each sensitive field as a raw string with a shared nonce, matching Flutterwave's v4 encryption guide.

```ts
import { encryptPayload, generateNonce } from '@wahya/flutterwave-v4-node-sdk';

const nonce = generateNonce();

const card = {
  nonce,
  encrypted_card_number: encryptPayload('5531886652142950', process.env.FLW_ENCRYPTION_KEY!, nonce).encryptedData,
  encrypted_expiry_month: encryptPayload('09', process.env.FLW_ENCRYPTION_KEY!, nonce).encryptedData,
  encrypted_expiry_year: encryptPayload('32', process.env.FLW_ENCRYPTION_KEY!, nonce).encryptedData,
  encrypted_cvv: encryptPayload('564', process.env.FLW_ENCRYPTION_KEY!, nonce).encryptedData,
};
```

## Sandbox Test Project

A local consumer app for smoke-testing the SDK against Flutterwave sandbox is included in `examples/sandbox-smoke-test`. It installs the SDK from the local package root and defaults to read-only checks.

## Maintainer Sync

This package is mirrored between the public `flutterwave-v4-node-sdk` repository and the Wahya monorepo at `packages/flutterwave-sdk`.

Maintainers who have both repositories checked out can sync the shared package surface from the monorepo root with:

```sh
pnpm sdk:sync:status
pnpm sdk:sync:push
pnpm sdk:sync:pull
```

The sync intentionally covers the publishable package surface only. Repo-specific files such as `.github/**`, `package-lock.json`, `vendor/**`, `dist/**`, `node_modules/**`, and the monorepo-only `project.json` stay local to each repository.

## Notes

- The `refund.completed` webhook page is a webhook event reference, not a merchant-initiated API request, so it is intentionally excluded from the client surface.
- The SDK expects Node.js 18 or newer.
