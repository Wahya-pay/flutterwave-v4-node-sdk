import { BaseResource } from './base-resource';
import type { FlutterwaveRequestOptions } from '../types/common';
import type * as Endpoints from '../types/endpoints';

function normalizeCardInput<T extends Record<string, unknown>>(value: T): T {
  const card = value.card;

  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    return value;
  }

  const cardInput = card as Record<string, unknown>;

  if (!('encrypted_number' in cardInput) || 'encrypted_card_number' in cardInput) {
    return value;
  }

  const { encrypted_number, ...restCard } = cardInput;

  return {
    ...value,
    card: {
      ...restCard,
      encrypted_card_number: encrypted_number,
    },
  } as T;
}

function normalizePaymentMethodInput<T extends Record<string, unknown>>(value: T): T {
  const paymentMethod = value.payment_method;

  if (!paymentMethod || typeof paymentMethod !== 'object' || Array.isArray(paymentMethod)) {
    return value;
  }

  return {
    ...value,
    payment_method: normalizeCardInput(paymentMethod as Record<string, unknown>),
  } as T;
}

function normalizeBankAccountResolveInput(body: Endpoints.BankAccountResolveRequest): Endpoints.BankAccountResolveRequest {
  if (body.account) {
    return body;
  }

  if (!body.account_number || !body.bank_code) {
    return body;
  }

  return {
    ...body,
    currency: body.currency ?? 'NGN',
    account: {
      number: body.account_number,
      code: body.bank_code,
    },
  };
}

function normalizeTransferRateInput(body: Endpoints.CreateTransferRateRequest): Endpoints.CreateTransferRateRequest {
  if (body.source && body.destination) {
    return body;
  }

  if (!body.source_currency || !body.destination_currency || body.amount == null) {
    return body;
  }

  return {
    ...body,
    source: {
      currency: body.source_currency,
    },
    destination: {
      currency: body.destination_currency,
      amount: body.amount,
    },
  };
}

export class CustomersResource extends BaseResource {
  list(query?: Endpoints.CustomersListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.CustomersListResponse> {
    return this.requestGet('/customers', query, options);
  }

  create(body: Endpoints.CreateCustomerRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.CustomerResponse> {
    return this.requestPost('/customers', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.CustomerResponse> {
    return this.http.request('GET', '/customers/{id}', { ...options, pathParams: { id } });
  }

  update(id: string | number, body: Endpoints.UpdateCustomerRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.CustomerResponse> {
    return this.http.request('PUT', '/customers/{id}', { ...options, pathParams: { id }, body });
  }

  search(body: Endpoints.SearchCustomersRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.CustomersSearchResponse> {
    return this.requestPost('/customers/search', body, options);
  }
}

export class ChargesResource extends BaseResource {
  list(query?: Endpoints.ChargesListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargesListResponse> {
    return this.requestGet('/charges', query, options);
  }

  create(body: Endpoints.CreateChargeRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargeResponse> {
    return this.requestPost('/charges', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargeResponse> {
    return this.http.request('GET', '/charges/{id}', { ...options, pathParams: { id } });
  }

  update(id: string | number, body: Endpoints.UpdateChargeRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargeResponse> {
    return this.http.request('PUT', '/charges/{id}', { ...options, pathParams: { id }, body });
  }
}

export class OrchestrationResource extends BaseResource {
  createDirectCharge(
    body: Endpoints.CreateOrchestrationChargeRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.OrchestrationChargeResponse> {
    return this.requestPost('/orchestration/direct-charges', normalizePaymentMethodInput(body), options);
  }

  createDirectOrder(
    body: Endpoints.CreateOrchestrationOrderRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.OrchestrationOrderResponse> {
    return this.requestPost('/orchestration/direct-orders', normalizePaymentMethodInput(body), options);
  }
}

export class PaymentMethodsResource extends BaseResource {
  list(
    query?: Endpoints.PaymentMethodsListQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.PaymentMethodsListResponse> {
    return this.requestGet('/payment-methods', query, options);
  }

  create(
    body: Endpoints.CreatePaymentMethodRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.PaymentMethodResponse> {
    return this.requestPost('/payment-methods', normalizeCardInput(body), options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.PaymentMethodResponse> {
    return this.http.request('GET', '/payment-methods/{id}', { ...options, pathParams: { id } });
  }
}

export class MobileNetworksResource extends BaseResource {
  list(
    query?: Endpoints.MobileNetworksListQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.MobileNetworksListResponse> {
    return this.requestGet('/mobile-networks', query, options);
  }
}

export class BanksResource extends BaseResource {
  list(query?: Endpoints.BanksListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.BanksListResponse> {
    return this.requestGet('/banks', query, options);
  }

  getBranches(
    id: string | number,
    query?: Endpoints.BankBranchesListQuery,
    options: FlutterwaveRequestOptions = {},
  ): Promise<Endpoints.BankBranchesListResponse> {
    return this.http.request('GET', '/banks/{id}/branches', { ...options, pathParams: { id }, query });
  }

  resolveAccount(
    body: Endpoints.BankAccountResolveRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.BankAccountResolveResponse> {
    return this.requestPost('/banks/account-resolve', normalizeBankAccountResolveInput(body), options);
  }
}

export class WalletsResource extends BaseResource {
  resolveAccount(
    body: Endpoints.WalletAccountResolveRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.WalletAccountResolveResponse> {
    return this.requestPost('/wallets/account-resolve', body, options);
  }

  getStatement(
    query?: Endpoints.WalletStatementQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.WalletStatementResponse> {
    return this.requestGet('/wallets/statement', query, options);
  }

  getBalance(currency: string, options?: FlutterwaveRequestOptions): Promise<Endpoints.WalletBalanceResponse> {
    return this.http.request('GET', '/wallets/balances/{currency}', {
      ...options,
      pathParams: { currency },
    });
  }

  getBalances(
    query?: Endpoints.WalletBalancesQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.WalletBalancesResponse> {
    return this.requestGet('/wallets/balances', query, options);
  }
}

export class DirectTransfersResource extends BaseResource {
  create(
    body: Endpoints.CreateDirectTransferRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.DirectTransferResponse> {
    return this.requestPost('/direct-transfers', body, options);
  }
}

export class TransfersResource extends BaseResource {
  list(query?: Endpoints.TransfersListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransfersListResponse> {
    return this.requestGet('/transfers', query, options);
  }

  create(body: Endpoints.CreateTransferRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransferResponse> {
    return this.requestPost('/transfers', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransferResponse> {
    return this.http.request('GET', '/transfers/{id}', { ...options, pathParams: { id } });
  }

  update(
    id: string | number,
    body: Endpoints.UpdateTransferRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferResponse> {
    return this.http.request('PUT', '/transfers/{id}', { ...options, pathParams: { id }, body });
  }

  retry(
    id: string | number,
    body: Endpoints.RetryTransferRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferResponse> {
    return this.http.request('POST', '/transfers/{id}/retries', {
      ...options,
      pathParams: { id },
      body,
    });
  }
}

export class TransferRecipientsResource extends BaseResource {
  list(
    query?: Endpoints.TransferRecipientsListQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferRecipientsListResponse> {
    return this.requestGet('/transfers/recipients', query, options);
  }

  create(
    body: Endpoints.CreateTransferRecipientRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferRecipientResponse> {
    return this.requestPost('/transfers/recipients', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransferRecipientResponse> {
    return this.http.request('GET', '/transfers/recipients/{id}', {
      ...options,
      pathParams: { id },
    });
  }

  delete(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.DeleteResourceResponse> {
    return this.http.request('DELETE', '/transfers/recipients/{id}', {
      ...options,
      pathParams: { id },
    });
  }
}

export class TransferSendersResource extends BaseResource {
  list(
    query?: Endpoints.TransferSendersListQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferSendersListResponse> {
    return this.requestGet('/transfers/senders', query, options);
  }

  create(
    body: Endpoints.CreateTransferSenderRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferSenderResponse> {
    return this.requestPost('/transfers/senders', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransferSenderResponse> {
    return this.http.request('GET', '/transfers/senders/{id}', {
      ...options,
      pathParams: { id },
    });
  }

  delete(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.DeleteResourceResponse> {
    return this.http.request('DELETE', '/transfers/senders/{id}', {
      ...options,
      pathParams: { id },
    });
  }
}

export class TransferRatesResource extends BaseResource {
  create(
    body: Endpoints.CreateTransferRateRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.TransferRateResponse> {
    return this.requestPost('/transfers/rates', normalizeTransferRateInput(body), options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.TransferRateResponse> {
    return this.http.request('GET', '/transfers/rates/{id}', {
      ...options,
      pathParams: { id },
    });
  }
}

export class SettlementsResource extends BaseResource {
  list(query?: Endpoints.SettlementsListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.SettlementsListResponse> {
    return this.requestGet('/settlements', query, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.SettlementResponse> {
    return this.http.request('GET', '/settlements/{id}', { ...options, pathParams: { id } });
  }
}

export class ChargebacksResource extends BaseResource {
  list(query?: Endpoints.ChargebacksListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargebacksListResponse> {
    return this.requestGet('/chargebacks', query, options);
  }

  create(
    body: Endpoints.CreateChargebackRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.ChargebackResponse> {
    return this.requestPost('/chargebacks', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.ChargebackResponse> {
    return this.http.request('GET', '/chargebacks/{id}', { ...options, pathParams: { id } });
  }

  update(
    id: string | number,
    body: Endpoints.UpdateChargebackRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.ChargebackResponse> {
    return this.http.request('PUT', '/chargebacks/{id}', { ...options, pathParams: { id }, body });
  }
}

export class RefundsResource extends BaseResource {
  list(query?: Endpoints.RefundsListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.RefundsListResponse> {
    return this.requestGet('/refunds', query, options);
  }

  create(body: Endpoints.CreateRefundRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.RefundResponse> {
    return this.requestPost('/refunds', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.RefundResponse> {
    return this.http.request('GET', '/refunds/{id}', { ...options, pathParams: { id } });
  }
}

export class FeesResource extends BaseResource {
  get(query?: Endpoints.FeesGetQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.FeesGetResponse> {
    if (!query) {
      return this.requestGet('/fees', query, options);
    }

    const normalizedQuery =
      query.payment_method || !query.payment_type
        ? query
        : {
            ...query,
            payment_method: query.payment_type,
          };

    return this.requestGet('/fees', normalizedQuery, options);
  }
}

export class OrdersResource extends BaseResource {
  list(query?: Endpoints.OrdersListQuery, options?: FlutterwaveRequestOptions): Promise<Endpoints.OrdersListResponse> {
    return this.requestGet('/orders', query, options);
  }

  create(body: Endpoints.CreateOrderRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.OrderResponse> {
    return this.requestPost('/orders', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.OrderResponse> {
    return this.http.request('GET', '/orders/{id}', { ...options, pathParams: { id } });
  }

  update(id: string | number, body: Endpoints.UpdateOrderRequest, options?: FlutterwaveRequestOptions): Promise<Endpoints.OrderResponse> {
    return this.http.request('PUT', '/orders/{id}', { ...options, pathParams: { id }, body });
  }
}

export class VirtualAccountsResource extends BaseResource {
  list(
    query?: Endpoints.VirtualAccountsListQuery,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.VirtualAccountsListResponse> {
    return this.requestGet('/virtual-accounts', query, options);
  }

  create(
    body: Endpoints.CreateVirtualAccountRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.VirtualAccountResponse> {
    return this.requestPost('/virtual-accounts', body, options);
  }

  get(id: string | number, options?: FlutterwaveRequestOptions): Promise<Endpoints.VirtualAccountResponse> {
    return this.http.request('GET', '/virtual-accounts/{id}', { ...options, pathParams: { id } });
  }

  update(
    id: string | number,
    body: Endpoints.UpdateVirtualAccountRequest,
    options?: FlutterwaveRequestOptions,
  ): Promise<Endpoints.VirtualAccountResponse> {
    return this.http.request('PUT', '/virtual-accounts/{id}', { ...options, pathParams: { id }, body });
  }
}