import type {
  Charge,
  ChargeResponse,
  ChargesListResponse,
  CreateChargeRequest,
  CreateCustomerRequest,
  CreateOrchestrationChargeRequest,
  CreateOrderRequest,
  CreatePaymentMethodRequest,
  CreateTransferRequest,
  CreateVirtualAccountRequest,
  CursorPageInfo,
  CustomerResponse,
  CustomersListResponse,
  DeleteResourceResponse,
  FlutterwaveApiResult,
  FlutterwaveClient,
  OrchestrationChargeResponse,
  OrderResponse,
  Transfer,
  TransferRecipient,
  TransferRecipientsListResponse,
  TransferSender,
  TransferSendersListResponse,
  TransfersListResponse,
  WalletStatementResponse,
  WalletTransaction,
} from '../src';

type Equal<Left, Right> = (<Type>() => Type extends Left ? 1 : 2) extends <Type>() => Type extends Right ? 1 : 2
  ? true
  : false;

type Expect<Value extends true> = Value;

declare const client: FlutterwaveClient;

type CustomersCreateArg = Parameters<typeof client.customers.create>[0];
type CustomersCreateReturn = Awaited<ReturnType<typeof client.customers.create>>;
type ChargesCreateArg = Parameters<typeof client.charges.create>[0];
type ChargesCreateReturn = Awaited<ReturnType<typeof client.charges.create>>;
type OrchestrationCreateArg = Parameters<typeof client.orchestration.createDirectCharge>[0];
type OrchestrationCreateReturn = Awaited<ReturnType<typeof client.orchestration.createDirectCharge>>;
type OrdersCreateArg = Parameters<typeof client.orders.create>[0];
type OrdersCreateReturn = Awaited<ReturnType<typeof client.orders.create>>;
type TransferCreateArg = Parameters<typeof client.transfers.create>[0];
type TransferRecipientsDeleteReturn = Awaited<ReturnType<typeof client.transferRecipients.delete>>;
type WalletStatementReturn = Awaited<ReturnType<typeof client.wallets.getStatement>>;
type TransfersListReturn = Awaited<ReturnType<typeof client.transfers.list>>;
type TransferRecipientsListReturn = Awaited<ReturnType<typeof client.transferRecipients.list>>;
type TransferSendersListReturn = Awaited<ReturnType<typeof client.transferSenders.list>>;

type _CustomersCreateArg = Expect<Equal<CustomersCreateArg, CreateCustomerRequest>>;
type _CustomersCreateReturn = Expect<Equal<CustomersCreateReturn, CustomerResponse>>;
type _ChargesCreateArg = Expect<Equal<ChargesCreateArg, CreateChargeRequest>>;
type _ChargesCreateReturn = Expect<Equal<ChargesCreateReturn, ChargeResponse>>;
type _OrchestrationCreateArg = Expect<Equal<OrchestrationCreateArg, CreateOrchestrationChargeRequest>>;
type _OrchestrationCreateReturn = Expect<Equal<OrchestrationCreateReturn, OrchestrationChargeResponse>>;
type _OrdersCreateArg = Expect<Equal<OrdersCreateArg, CreateOrderRequest>>;
type _OrdersCreateReturn = Expect<Equal<OrdersCreateReturn, OrderResponse>>;
type _TransferCreateArg = Expect<Equal<TransferCreateArg, CreateTransferRequest>>;
type _TransferRecipientsDeleteReturn = Expect<Equal<TransferRecipientsDeleteReturn, DeleteResourceResponse>>;
type _WalletStatementReturn = Expect<Equal<WalletStatementReturn, WalletStatementResponse>>;
type _TransfersListReturn = Expect<Equal<TransfersListReturn, TransfersListResponse>>;
type _TransferRecipientsListReturn = Expect<Equal<TransferRecipientsListReturn, TransferRecipientsListResponse>>;
type _TransferSendersListReturn = Expect<Equal<TransferSendersListReturn, TransferSendersListResponse>>;

const createCustomerRequest: CreateCustomerRequest = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  phone: {
    country_code: '234',
    number: '8001122334',
  },
};

const createChargeRequest: CreateChargeRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
  customer_id: 'cus_123',
  payment_method_id: 'pmd_123',
};

const createOrchestrationChargeRequest: CreateOrchestrationChargeRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
  customer: createCustomerRequest,
  payment_method: {
    type: 'opay',
  },
};

const createOrderRequest: CreateOrderRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'ord-123',
  customer_id: 'cus_123',
  payment_method_id: 'pmd_123',
};

const createTransferRequest: CreateTransferRequest = {
  action: 'instant',
  payment_instruction: {
    source_currency: 'NGN',
    recipient_id: 'rcb_123',
    sender_id: 'sdr_123',
    amount: {
      value: 5000,
      applies_to: 'destination_currency',
    },
  },
  reference: 'trf-123',
};

const createPaymentMethodRequest: CreatePaymentMethodRequest = {
  type: 'card',
  card: {
    encrypted_number: 'enc-number',
    encrypted_expiry_month: 'enc-month',
    encrypted_expiry_year: 'enc-year',
    encrypted_cvv: 'enc-cvv',
  },
};

const createVirtualAccountRequest: CreateVirtualAccountRequest = {
  customer_id: 'cus_123',
  amount: 1000,
  reference: 'va-123',
  currency: 'NGN',
  account_type: 'static',
};

void createCustomerRequest;
void createChargeRequest;
void createOrchestrationChargeRequest;
void createOrderRequest;
void createTransferRequest;
void createPaymentMethodRequest;
void createVirtualAccountRequest;

// @ts-expect-error Customer creation requires an email.
const invalidCustomerRequest: CreateCustomerRequest = {
  name: 'Ada Lovelace',
};

// @ts-expect-error Standard charges require saved customer and payment method IDs.
const invalidChargeRequest: CreateChargeRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
};

// @ts-expect-error Orchestration direct charges require embedded customer and payment method payloads.
const invalidOrchestrationRequest: CreateOrchestrationChargeRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'tx-123',
};

// @ts-expect-error Orders require saved customer and payment method IDs.
const invalidOrderRequest: CreateOrderRequest = {
  amount: 1250,
  currency: 'NGN',
  reference: 'ord-123',
};

// @ts-expect-error Payment method discriminators are required.
const invalidPaymentMethodRequest: CreatePaymentMethodRequest = {
  card: {
    encrypted_number: 'enc-number',
    encrypted_expiry_month: 'enc-month',
    encrypted_expiry_year: 'enc-year',
    encrypted_cvv: 'enc-cvv',
  },
};

// @ts-expect-error Transfer creation requires an action and payment instruction.
const invalidTransferRequest: CreateTransferRequest = {
  reference: 'trf-123',
};

// @ts-expect-error Virtual account creation requires customer, amount, reference, currency, and account type.
const invalidVirtualAccountRequest: CreateVirtualAccountRequest = {
  customer_id: 'cus_123',
  amount: 1000,
};

declare const walletStatementResponse: WalletStatementResponse;
declare const transfersListResponse: TransfersListResponse;
declare const recipientsListResponse: TransferRecipientsListResponse;
declare const sendersListResponse: TransferSendersListResponse;
declare const rawChargeResult: FlutterwaveApiResult<Charge>;

const walletStatementCursor: CursorPageInfo | undefined = walletStatementResponse.data.cursor;
const walletStatementTransactions: WalletTransaction[] | undefined = walletStatementResponse.data.transactions;
const transfersCursor: CursorPageInfo | undefined = transfersListResponse.data.cursor;
const transfers: Transfer[] | undefined = transfersListResponse.data.transfers;
const recipientsCursor: CursorPageInfo | undefined = recipientsListResponse.data.cursor;
const recipients: TransferRecipient[] | undefined = recipientsListResponse.data.recipients;
const sendersCursor: CursorPageInfo | undefined = sendersListResponse.data.cursor;
const senders: TransferSender[] | undefined = sendersListResponse.data.senders;

if (rawChargeResult.status === 'success') {
  const chargeId = rawChargeResult.data.id;
  void chargeId;
} else {
  const errorCode = rawChargeResult.error.code;
  void errorCode;
}

void walletStatementCursor;
void walletStatementTransactions;
void transfersCursor;
void transfers;
void recipientsCursor;
void recipients;
void sendersCursor;
void senders;
void invalidCustomerRequest;
void invalidChargeRequest;
void invalidOrchestrationRequest;
void invalidOrderRequest;
void invalidPaymentMethodRequest;
void invalidTransferRequest;
void invalidVirtualAccountRequest;

declare const customersListResponse: CustomersListResponse;
declare const customerResponse: CustomerResponse;
declare const chargesListResponse: ChargesListResponse;

void customersListResponse;
void customerResponse;
void chargesListResponse;