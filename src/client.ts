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

export class FlutterwaveClient {
  readonly customers: CustomersResource;
  readonly charges: ChargesResource;
  readonly orchestration: OrchestrationResource;
  readonly paymentMethods: PaymentMethodsResource;
  readonly mobileNetworks: MobileNetworksResource;
  readonly banks: BanksResource;
  readonly wallets: WalletsResource;
  readonly directTransfers: DirectTransfersResource;
  readonly transfers: TransfersResource;
  readonly transferRecipients: TransferRecipientsResource;
  readonly transferSenders: TransferSendersResource;
  readonly transferRates: TransferRatesResource;
  readonly settlements: SettlementsResource;
  readonly chargebacks: ChargebacksResource;
  readonly refunds: RefundsResource;
  readonly fees: FeesResource;
  readonly orders: OrdersResource;
  readonly virtualAccounts: VirtualAccountsResource;

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