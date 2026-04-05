import type { FlutterwaveErrorPayload, RequestQuery } from './common';

export interface FlexibleObject {
  [key: string]: unknown;
}

export type ResourceId = string | number;
export type CurrencyCode = string;
export type Metadata = Record<string, string>;

export interface PageInfo extends FlexibleObject {
  total?: number;
  current_page?: number;
  total_pages?: number;
}

export interface CursorPageInfo extends FlexibleObject {
  next?: string;
  previous?: string;
  limit?: number;
  total?: number;
  has_more_items?: boolean;
}

export interface ApiMeta extends FlexibleObject {
  page_info?: PageInfo;
  cursor?: CursorPageInfo;
  page?: number;
  limit?: number;
  size?: number;
  total?: number;
  next_cursor?: string;
  previous_cursor?: string;
  has_more_items?: boolean;
}

export interface FlutterwaveSuccessResponse<TData> extends FlexibleObject {
  status: 'success';
  message?: string;
  data: TData;
  meta?: ApiMeta;
}

export interface FlutterwaveErrorResponse extends FlexibleObject {
  status: 'failed';
  message?: string;
  error: FlutterwaveErrorPayload;
  meta?: ApiMeta;
}

export type FlutterwaveApiResponse<TData> = FlutterwaveSuccessResponse<TData>;
export type FlutterwaveApiResult<TData> = FlutterwaveSuccessResponse<TData> | FlutterwaveErrorResponse;

export interface DeleteResourceResult extends FlexibleObject {
  id?: ResourceId;
  deleted?: boolean;
}

export type DeleteResourceResponse = FlutterwaveSuccessResponse<DeleteResourceResult>;

export interface PaginationQuery extends RequestQuery {
  page?: number;
  size?: number;
  limit?: number;
}

export interface CursorPaginationQuery extends RequestQuery {
  next?: string;
  previous?: string;
  size?: number;
}

export interface DateRangeQuery extends PaginationQuery {
  from?: string;
  to?: string;
}

export interface CursorDateRangeQuery extends CursorPaginationQuery {
  from?: string;
  to?: string;
}

export interface ResourceReferenceQuery extends DateRangeQuery {
  status?: string;
  reference?: string;
  search?: string;
}

export interface Address extends FlexibleObject {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface Phone extends FlexibleObject {
  country_code: string;
  number: string;
}

export interface PersonName extends FlexibleObject {
  first: string;
  last: string;
  middle?: string;
}

export interface BaseEntity extends FlexibleObject {
  id?: ResourceId;
  status?: string;
  reference?: string;
  amount?: number;
  currency?: CurrencyCode;
  meta?: Metadata;
  created_datetime?: string;
  updated_datetime?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer extends BaseEntity {
  address?: Address;
  email?: string;
  name?: string;
  phone?: Phone;
  customer_code?: string;
}

export interface CustomersListQuery extends PaginationQuery {}

export interface CreateCustomerRequest extends FlexibleObject {
  email: string;
  address?: Address;
  meta?: Metadata;
  name?: string;
  phone?: Phone;
}

export interface UpdateCustomerRequest extends FlexibleObject {
  address?: Address;
  meta?: Metadata;
  name?: string;
  phone?: Phone;
}

export interface SearchCustomersRequest extends FlexibleObject {
  email: string;
}

export type CustomersListResponse = FlutterwaveApiResponse<Customer[]>;
export type CustomerResponse = FlutterwaveApiResponse<Customer>;
export type CustomersSearchResponse = FlutterwaveApiResponse<Customer[]>;

export interface CredentialOnFileInput extends FlexibleObject {
  enabled: boolean;
  agreement_id?: string;
}

export interface OtpAuthorizationInput extends FlexibleObject {
  type: 'otp';
  otp?: FlexibleObject;
}

export interface PinAuthorizationInput extends FlexibleObject {
  type: 'pin';
  pin?: FlexibleObject;
}

export interface External3dsAuthorizationInput extends FlexibleObject {
  type: 'external_3ds';
  external_3ds?: FlexibleObject;
}

export interface AvsAuthorizationInput extends FlexibleObject {
  type: 'avs';
  avs?: FlexibleObject;
}

export interface ThreeDsAuthorizationInput extends FlexibleObject {
  type: '3ds';
  ['3ds']?: FlexibleObject;
}

export type AuthorizationInput =
  | OtpAuthorizationInput
  | PinAuthorizationInput
  | External3dsAuthorizationInput
  | AvsAuthorizationInput;

export type OrderAuthorizationInput = ThreeDsAuthorizationInput;

export interface BasePaymentMethodInput extends FlexibleObject {
  customer_id?: string;
  meta?: Metadata;
}

export interface EncryptedCardInput extends FlexibleObject {
  encrypted_number: string;
  encrypted_expiry_month: string;
  encrypted_expiry_year: string;
  encrypted_cvv: string;
  billing_address?: Address;
  cof?: CredentialOnFileInput;
  card_holder_name?: string;
}

export interface CardPaymentMethodInput extends BasePaymentMethodInput {
  type: 'card';
  card: EncryptedCardInput;
}

export interface BankAccountPaymentMethodInput extends BasePaymentMethodInput {
  type: 'bank_account';
  bank_account: FlexibleObject;
}

export interface MobileMoneyInput extends FlexibleObject {
  network: string;
  country_code: string;
  phone_number: string;
  use_qr?: boolean;
}

export interface MobileMoneyPaymentMethodInput extends BasePaymentMethodInput {
  type: 'mobile_money';
  mobile_money: MobileMoneyInput;
}

export interface OpayPaymentMethodInput extends BasePaymentMethodInput {
  type: 'opay';
  opay?: FlexibleObject;
}

export interface ApplePayPaymentMethodInput extends BasePaymentMethodInput {
  type: 'applepay';
  applepay?: {
    card_holder_name?: string;
  };
}

export interface GooglePayPaymentMethodInput extends BasePaymentMethodInput {
  type: 'googlepay';
  googlepay?: {
    card_holder_name?: string;
  };
}

export interface UssdPaymentMethodInput extends BasePaymentMethodInput {
  type: 'ussd';
  ussd: {
    account_bank: string;
  };
}

export type PaymentMethodInput =
  | CardPaymentMethodInput
  | BankAccountPaymentMethodInput
  | MobileMoneyPaymentMethodInput
  | OpayPaymentMethodInput
  | ApplePayPaymentMethodInput
  | GooglePayPaymentMethodInput
  | UssdPaymentMethodInput;

export interface RedirectTarget extends FlexibleObject {
  url: string;
}

export interface RedirectUrlNextAction extends FlexibleObject {
  type: 'redirect_url';
  redirect_url: RedirectTarget;
}

export interface RequiresAdditionalFieldsNextAction extends FlexibleObject {
  type: 'requires_additional_fields';
  requires_additional_fields: {
    fields: string[];
  };
}

export interface RequiresPinNextAction extends FlexibleObject {
  type: 'requires_pin';
  requires_pin: FlexibleObject;
}

export interface RequiresRequeryNextAction extends FlexibleObject {
  type: 'requires_requery';
  requires_requery: FlexibleObject;
}

export interface RequiresOtpNextAction extends FlexibleObject {
  type: 'requires_otp';
  requires_otp: FlexibleObject;
}

export interface PaymentInstructionNextAction extends FlexibleObject {
  type: 'payment_instruction';
  payment_instruction: {
    note: string;
  };
}

export interface RequiresCaptureNextAction extends FlexibleObject {
  type: 'requires_capture';
  requires_capture: FlexibleObject;
}

export interface RequiresBankTransferNextAction extends FlexibleObject {
  type: 'requires_bank_transfer';
  requires_bank_transfer: {
    account_number: string;
    account_bank_name: string;
    account_type?: string;
    account_expiration_datetime?: string;
    note?: string;
  };
}

export interface QrCodeNextAction extends FlexibleObject {
  type: 'qr_code';
  qr_code: {
    image: string;
  };
}

export type NextAction =
  | RedirectUrlNextAction
  | RequiresAdditionalFieldsNextAction
  | RequiresPinNextAction
  | RequiresRequeryNextAction
  | RequiresOtpNextAction
  | PaymentInstructionNextAction
  | RequiresCaptureNextAction
  | RequiresBankTransferNextAction
  | QrCodeNextAction;

export type ChargeStatus = 'succeeded' | 'pending' | 'failed' | 'voided';

export interface FeeBreakdown extends FlexibleObject {
  type?: string;
  amount?: number;
  currency?: CurrencyCode;
}

export interface BillingDetails extends FlexibleObject {
  email?: string;
  name?: string;
  phone?: Phone;
}

export interface Charge extends BaseEntity {
  id?: string;
  fees?: FeeBreakdown[];
  billing_details?: BillingDetails;
  customer_id?: string;
  description?: string;
  disputed?: boolean;
  settled?: boolean;
  settlement_id?: string[];
  next_action?: NextAction;
  payment_method_details?: PaymentMethod;
  redirect_url?: string;
  refunded?: boolean;
  processor_response?: string;
  status?: ChargeStatus;
}

export interface ChargesListQuery extends ResourceReferenceQuery {
  customer_id?: string;
  virtual_account_id?: string;
  payment_method_id?: string;
  order_id?: string;
}

export interface CreateChargeRequest extends FlexibleObject {
  amount: number;
  currency: CurrencyCode;
  reference: string;
  customer_id: string;
  payment_method_id: string;
  meta?: Metadata;
  redirect_url?: string;
  authorization?: AuthorizationInput;
  recurring?: boolean;
  order_id?: string;
  merchant_vat_amount?: number;
}

export interface UpdateChargeRequest extends FlexibleObject {
  meta?: Metadata;
  authorization?: AuthorizationInput;
}

export type ChargesListResponse = FlutterwaveApiResponse<Charge[]>;
export type ChargeResponse = FlutterwaveApiResponse<Charge>;

export interface OrchestrationCharge extends Charge {
  order_id?: string;
}

export interface OrchestrationOrder extends BaseEntity {
  redirect_url?: string;
  customer_id?: string;
}

export interface CreateOrchestrationChargeRequest extends FlexibleObject {
  amount: number;
  currency: CurrencyCode;
  reference: string;
  customer: CreateCustomerRequest;
  payment_method: PaymentMethodInput;
  meta?: Metadata;
  redirect_url?: string;
  authorization?: AuthorizationInput;
  merchant_vat_amount?: number;
}

export interface CreateOrchestrationOrderRequest extends FlexibleObject {
  amount: number;
  currency: CurrencyCode;
  reference: string;
  customer: CreateCustomerRequest;
  payment_method: PaymentMethodInput;
  meta?: Metadata;
  redirect_url?: string;
  authorization?: OrderAuthorizationInput;
  merchant_vat_amount?: number;
}

export type OrchestrationChargeResponse = FlutterwaveApiResponse<OrchestrationCharge>;
export type OrchestrationOrderResponse = FlutterwaveApiResponse<OrchestrationOrder>;

export interface PaymentMethod extends BaseEntity {
  id?: string;
  type?: string;
  customer_id?: string;
  device_fingerprint?: string;
  client_ip?: string;
  card?: FlexibleObject;
  bank_account?: FlexibleObject;
  mobile_money?: FlexibleObject;
  opay?: FlexibleObject;
  applepay?: FlexibleObject;
  googlepay?: FlexibleObject;
  ussd?: FlexibleObject;
}

export interface PaymentMethodsListQuery extends PaginationQuery {}

export type CreatePaymentMethodRequest = PaymentMethodInput;

export type PaymentMethodsListResponse = FlutterwaveApiResponse<PaymentMethod[]>;
export type PaymentMethodResponse = FlutterwaveApiResponse<PaymentMethod>;

export interface MobileNetwork extends FlexibleObject {
  id?: ResourceId;
  name?: string;
  code?: string;
  country?: string;
}

export interface MobileNetworksListQuery extends RequestQuery {
  country?: string;
}

export type MobileNetworksListResponse = FlutterwaveApiResponse<MobileNetwork[]>;

export interface Bank extends FlexibleObject {
  id?: ResourceId;
  code?: string;
  name?: string;
  country?: string;
  currency?: CurrencyCode;
}

export interface BankBranch extends FlexibleObject {
  id?: ResourceId;
  branch_code?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface AccountLookupResult extends FlexibleObject {
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  currency?: CurrencyCode;
}

export interface BanksListQuery extends RequestQuery {
  country?: string;
  currency?: CurrencyCode;
}

export interface BankBranchesListQuery extends RequestQuery {
  country?: string;
}

export interface BankAccountResolveRequest extends FlexibleObject {
  account_number: string;
  bank_code: string;
  currency?: CurrencyCode;
}

export type BanksListResponse = FlutterwaveApiResponse<Bank[]>;
export type BankBranchesListResponse = FlutterwaveApiResponse<BankBranch[]>;
export type BankAccountResolveResponse = FlutterwaveApiResponse<AccountLookupResult>;

export interface WalletBalance extends FlexibleObject {
  currency?: CurrencyCode;
  available_balance?: number;
}

export interface WalletTransactionAmount extends FlexibleObject {
  value?: number;
  currency?: CurrencyCode;
}

export interface WalletTransaction extends FlexibleObject {
  transaction_direction?: 'credit' | 'debit';
  amount?: WalletTransactionAmount;
  balance_after?: WalletTransactionAmount;
  balance_before?: WalletTransactionAmount;
  transaction_type?:
    | 'transfer'
    | 'fee'
    | 'reversal'
    | 'reversal_fee'
    | 'settlement'
    | 'funding'
    | 'bill'
    | 'chargeback'
    | 'card'
    | 'card_fee'
    | 'otp_saas';
  transaction_date?: string;
  transfer?: Transfer;
}

export interface WalletTransactionsPage extends FlexibleObject {
  cursor?: CursorPageInfo;
  transactions?: WalletTransaction[];
}

export interface WalletAccountResolveRequest extends FlexibleObject {
  provider: 'flutterwave';
  identifier: string;
}

export interface WalletAccountLookupResult extends FlexibleObject {
  provider?: string;
  identifier?: string;
  name?: string;
}

export interface WalletStatementQuery extends CursorDateRangeQuery {
  currency?: CurrencyCode;
}

export interface WalletBalancesQuery extends RequestQuery {}

export type WalletAccountResolveResponse = FlutterwaveApiResponse<WalletAccountLookupResult>;
export type WalletStatementResponse = FlutterwaveApiResponse<WalletTransactionsPage>;
export type WalletBalanceResponse = FlutterwaveApiResponse<WalletBalance>;
export type WalletBalancesResponse = FlutterwaveApiResponse<WalletBalance[]>;

export interface DirectTransfer extends BaseEntity {
  recipient_id?: string;
  sender_id?: string;
  fee?: number;
  narration?: string;
}

export interface CreateDirectTransferRequest extends FlexibleObject {
  amount?: number;
  currency?: CurrencyCode;
  recipient?: FlexibleObject;
  sender?: FlexibleObject;
  reference?: string;
  narration?: string;
  meta?: Metadata;
}

export type DirectTransferResponse = FlutterwaveApiResponse<DirectTransfer>;

export interface TransferAmountInput extends FlexibleObject {
  value: number;
  applies_to: string;
}

export interface TransferInstruction extends FlexibleObject {
  source_currency: CurrencyCode;
  amount: TransferAmountInput;
  recipient_id: string;
  sender_id?: string;
}

export interface Transfer extends BaseEntity {
  status?: 'NEW' | 'PENDING' | 'INITIATED' | 'CANCELLED' | 'FAILED' | 'SUCCESSFUL' | string;
  fee?: number;
  narration?: string;
  recipient_id?: string;
  sender_id?: string;
  proof?: string;
  disburse_datetime?: string;
}

export interface TransfersPage extends FlexibleObject {
  cursor?: CursorPageInfo;
  transfers?: Transfer[];
}

export interface TransfersListQuery extends CursorPaginationQuery {}

export interface CreateTransferRequest extends FlexibleObject {
  action: string;
  payment_instruction: TransferInstruction;
  reference?: string;
  narration?: string;
  disburse_option?: string;
  callback_url?: string;
  meta?: Metadata;
}

export interface UpdateTransferRequest extends FlexibleObject {
  initiate?: boolean;
  close?: boolean;
  disburse_option?: string;
  callback_url?: string;
  meta?: Metadata;
}

export interface RetryTransferRequest extends FlexibleObject {
  action: 'retry' | 'duplicate';
  reference?: string;
  meta?: Metadata;
  callback_url?: string;
}

export type TransfersListResponse = FlutterwaveApiResponse<TransfersPage>;
export type TransferResponse = FlutterwaveApiResponse<Transfer>;

export interface TransferRecipient extends FlexibleObject {
  id?: string;
  type?: string;
  name?: string | PersonName;
  email?: string;
  phone?: Phone;
  address?: Address;
  bank?: FlexibleObject;
  status?: string;
}

export interface TransferRecipientsPage extends FlexibleObject {
  cursor?: CursorPageInfo;
  recipients?: TransferRecipient[];
}

export interface TransferRecipientsListQuery extends CursorPaginationQuery {}

export interface CreateTransferRecipientRequest extends FlexibleObject {
  type?: string;
  name?: string | PersonName;
  email?: string;
  phone?: Phone;
  address?: Address;
  bank?: FlexibleObject;
  meta?: Metadata;
  account_number?: string;
  bank_code?: string;
  currency?: CurrencyCode;
  country?: string;
}

export type TransferRecipientsListResponse = FlutterwaveApiResponse<TransferRecipientsPage>;
export type TransferRecipientResponse = FlutterwaveApiResponse<TransferRecipient>;

export interface TransferSender extends FlexibleObject {
  id?: string;
  type?: string;
  name?: string | PersonName;
  email?: string;
  phone?: Phone;
  address?: Address;
  status?: string;
}

export interface TransferSendersPage extends FlexibleObject {
  cursor?: CursorPageInfo;
  senders?: TransferSender[];
}

export interface TransferSendersListQuery extends CursorPaginationQuery {}

export interface CreateTransferSenderRequest extends FlexibleObject {
  type?: string;
  name?: string | PersonName;
  email?: string;
  phone?: Phone;
  address?: Address;
  meta?: Metadata;
  country?: string;
}

export type TransferSendersListResponse = FlutterwaveApiResponse<TransferSendersPage>;
export type TransferSenderResponse = FlutterwaveApiResponse<TransferSender>;

export interface TransferRateQuote extends FlexibleObject {
  id?: ResourceId;
  source_currency?: CurrencyCode;
  destination_currency?: CurrencyCode;
  source_amount?: number;
  destination_amount?: number;
  rate?: number;
  fee?: number;
}

export interface CreateTransferRateRequest extends FlexibleObject {
  source_currency?: CurrencyCode;
  destination_currency?: CurrencyCode;
  amount?: number;
}

export type TransferRateResponse = FlutterwaveApiResponse<TransferRateQuote>;

export interface SettlementCharge extends FlexibleObject {
  id?: string;
  charged_amount?: number;
  customer_id?: string;
  settlement_amount?: number;
  payment_method_id?: string;
  currency?: CurrencyCode;
  charge_date?: string;
}

export interface Settlement extends BaseEntity {
  net_amount?: number;
  gross_amount?: number;
  fee?: number;
  charge_count?: string;
  charges?: SettlementCharge[];
}

export interface SettlementsListQuery extends DateRangeQuery {}

export type SettlementsListResponse = FlutterwaveApiResponse<Settlement[]>;
export type SettlementResponse = FlutterwaveApiResponse<Settlement>;

export interface Chargeback extends BaseEntity {
  charge_id?: string;
  stage?: 'new' | 'second' | 'pre-arbitration' | 'arbitration' | string;
  type?: string;
  uploaded_proof?: string;
  comment?: string;
  provider?: string;
  arn?: string;
  initiator?: string;
  due_datetime?: string;
}

export interface ChargebacksListQuery extends DateRangeQuery {}

export interface CreateChargebackRequest extends FlexibleObject {
  charge_id: string;
  amount: number;
  expiry: number;
  type: string;
  stage?: 'new' | 'second' | 'pre-arbitration' | 'arbitration' | string;
  uploaded_proof?: string;
  comment?: string;
  provider?: string;
  arn?: string;
  initiator?: string;
}

export interface UpdateChargebackRequest extends FlexibleObject {
  status?: 'accepted' | 'declined';
  uploaded_proof?: string;
  comment?: string;
  provider?: string;
  arn?: string;
  initiator?: string;
}

export type ChargebacksListResponse = FlutterwaveApiResponse<Chargeback[]>;
export type ChargebackResponse = FlutterwaveApiResponse<Chargeback>;

export interface Refund extends BaseEntity {
  charge_id?: string;
  reason?: string;
}

export interface RefundsListQuery extends DateRangeQuery {}

export interface CreateRefundRequest extends FlexibleObject {
  charge_id?: string;
  amount?: number;
  reason?: string;
  meta?: Metadata;
}

export type RefundsListResponse = FlutterwaveApiResponse<Refund[]>;
export type RefundResponse = FlutterwaveApiResponse<Refund>;

export interface FeeQuote extends FlexibleObject {
  amount?: number;
  currency?: CurrencyCode;
  fee?: number;
  fee_type?: string;
}

export interface FeesGetQuery extends RequestQuery {
  amount?: number;
  currency?: CurrencyCode;
  payment_type?: string;
}

export type FeesGetResponse = FlutterwaveApiResponse<FeeQuote>;

export interface Order extends BaseEntity {
  fees?: FeeBreakdown[];
  billing_details?: BillingDetails;
  customer_id?: string;
  description?: string;
  next_action?: NextAction;
  payment_method_details?: PaymentMethod;
  redirect_url?: string;
  processor_response?: string;
}

export interface OrdersListQuery extends ResourceReferenceQuery {
  customer_id?: string;
  payment_method_id?: string;
}

export interface CreateOrderRequest extends FlexibleObject {
  amount: number;
  currency: CurrencyCode;
  reference: string;
  customer_id: string;
  payment_method_id: string;
  meta?: Metadata;
  redirect_url?: string;
  authorization?: OrderAuthorizationInput;
  merchant_vat_amount?: number;
}

export interface UpdateOrderRequest extends FlexibleObject {
  meta?: Metadata;
  action?: 'void' | 'capture';
}

export type OrdersListResponse = FlutterwaveApiResponse<Order[]>;
export type OrderResponse = FlutterwaveApiResponse<Order>;

export interface VirtualAccount extends FlexibleObject {
  id?: string;
  amount?: number;
  account_number?: string;
  reference?: string;
  account_bank_name?: string;
  account_type?: string;
  status?: 'active' | 'inactive';
  account_expiration_datetime?: string;
  note?: string;
  customer_id?: string;
  created_datetime?: string;
  meta?: Metadata;
  customer_reference?: string;
  currency?: CurrencyCode;
}

export interface VirtualAccountsListQuery extends DateRangeQuery {
  reference?: string;
}

export interface CreateVirtualAccountRequest extends FlexibleObject {
  customer_id: string;
  amount: number;
  reference: string;
  currency: 'NGN' | 'GHS' | 'EGP' | 'KES' | 'MAD' | 'ZAR' | string;
  account_type: string;
  expiry?: number;
  bvn?: string;
  nin?: string;
  customer_account_number?: string;
  merchant_vat_amount?: number;
  bank_code?: string;
}

export interface UpdateVirtualAccountRequest extends FlexibleObject {
  action_type: 'update_bvn' | 'update_status';
  status?: 'inactive';
  bvn?: string;
}

export type VirtualAccountsListResponse = FlutterwaveApiResponse<VirtualAccount[]>;
export type VirtualAccountResponse = FlutterwaveApiResponse<VirtualAccount>;