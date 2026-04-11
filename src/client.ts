import { HttpClient } from './core/http-client';
import {
  BanksResource,
  ChargebacksResource,
  ChargesResource,
  CustomersResource,
  DirectTransfersResource,
  FeesResource,
  MobileNetworksResource,
  OrdersResource,
  OrchestrationResource,
  PaymentMethodsResource,
  RefundsResource,
  SettlementsResource,
  TransferRatesResource,
  TransferRecipientsResource,
  TransferSendersResource,
  TransfersResource,
  VirtualAccountsResource,
  WalletsResource,
} from './resources';
import type { FlutterwaveClientOptions } from './types/common';

/**
 * Primary entry point for the Flutterwave v4 SDK.
 *
 * Create one client per set of credentials, then access grouped resources such as
 * {@link FlutterwaveClient.customers}, {@link FlutterwaveClient.charges}, and
 * {@link FlutterwaveClient.transfers}.
 *
 * @example
 * ```ts
 * const client = new FlutterwaveClient({
 *   clientId: process.env.FLW_CLIENT_ID!,
 *   clientSecret: process.env.FLW_CLIENT_SECRET!,
 *   environment: 'sandbox',
 * });
 *
 * const customers = await client.customers.list({ page: 1, size: 10 });
 * ```
 */
export class FlutterwaveClient {
  /** Customer create, list, search, retrieve, and update operations. */
  readonly customers: CustomersResource;

  /** Stored-payment charge lifecycle operations, including charge updates for follow-up authorization. */
  readonly charges: ChargesResource;

  /** Embedded payment orchestration flows for direct charges and orders. */
  readonly orchestration: OrchestrationResource;

  /** Saved payment method management for card, OPay, bank account, and related methods. */
  readonly paymentMethods: PaymentMethodsResource;

  /** Mobile network lookup endpoints used by mobile money flows. */
  readonly mobileNetworks: MobileNetworksResource;

  /** Bank directory and account-resolution endpoints. */
  readonly banks: BanksResource;

  /** Wallet balance, statement, and wallet account resolution endpoints. */
  readonly wallets: WalletsResource;

  /** Direct transfer endpoints for transfer instructions that are created in a single request. */
  readonly directTransfers: DirectTransfersResource;

  /** Managed transfer lifecycle endpoints such as create, get, update, and retry. */
  readonly transfers: TransfersResource;

  /** Recipient management for transfer destinations. */
  readonly transferRecipients: TransferRecipientsResource;

  /** Sender management for transfer originator records. */
  readonly transferSenders: TransferSendersResource;

  /** Transfer quote and FX rate endpoints. */
  readonly transferRates: TransferRatesResource;

  /** Settlement listing and retrieval endpoints. */
  readonly settlements: SettlementsResource;

  /** Chargeback list, create, retrieve, and update endpoints. */
  readonly chargebacks: ChargebacksResource;

  /** Refund list, create, and retrieve endpoints. */
  readonly refunds: RefundsResource;

  /** Fee quote endpoint. */
  readonly fees: FeesResource;

  /** Order create, list, retrieve, and update endpoints. */
  readonly orders: OrdersResource;

  /** Virtual account create, list, retrieve, and update endpoints. */
  readonly virtualAccounts: VirtualAccountsResource;

  /**
   * Builds a client with OAuth credentials and initializes all resource groups.
   */
  constructor(options: FlutterwaveClientOptions) {
    const http = new HttpClient(options);

    this.customers = new CustomersResource(http);
    this.charges = new ChargesResource(http);
    this.orchestration = new OrchestrationResource(http);
    this.paymentMethods = new PaymentMethodsResource(http);
    this.mobileNetworks = new MobileNetworksResource(http);
    this.banks = new BanksResource(http);
    this.wallets = new WalletsResource(http);
    this.directTransfers = new DirectTransfersResource(http);
    this.transfers = new TransfersResource(http);
    this.transferRecipients = new TransferRecipientsResource(http);
    this.transferSenders = new TransferSendersResource(http);
    this.transferRates = new TransferRatesResource(http);
    this.settlements = new SettlementsResource(http);
    this.chargebacks = new ChargebacksResource(http);
    this.refunds = new RefundsResource(http);
    this.fees = new FeesResource(http);
    this.orders = new OrdersResource(http);
    this.virtualAccounts = new VirtualAccountsResource(http);
  }
}