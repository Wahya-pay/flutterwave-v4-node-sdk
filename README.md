# Flutterwave v4 Node SDK

TypeScript SDK for the Flutterwave v4 API, built from a local snapshot of Flutterwave's guides and reference pages.

## Install

```bash
npm install flutterwave-v4-node-sdk
```

## Usage

```ts
import { FlutterwaveClient } from 'flutterwave-v4-node-sdk';

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
  name: 'Ada Lovelace',
});

await client.charges.create({
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
  customer_id: String(customer.data.id),
  payment_method_id: 'pmd_WRq7L4TM8p',
});
```

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
} from 'flutterwave-v4-node-sdk';

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
} from 'flutterwave-v4-node-sdk';
```

## Notes

- The `refund.completed` webhook page is a webhook event reference, not a merchant-initiated API request, so it is intentionally excluded from the client surface.
- The SDK expects Node.js 18 or newer.
