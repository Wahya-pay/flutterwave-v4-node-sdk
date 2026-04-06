import 'dotenv/config';

import {
  FlutterwaveAPIError,
  FlutterwaveClient,
  encryptPayload,
  generateNonce,
  type FlutterwaveEnvironment,
} from '@wahya/flutterwave-v4-node-sdk';

type StepStatus = 'passed' | 'failed' | 'skipped';

interface StepReport {
  name: string;
  status: StepStatus;
  details?: Record<string, unknown>;
}

interface SandboxContext {
  customerId?: string;
  customerEmail?: string;
  paymentMethodId?: string;
  opayPaymentMethodId?: string;
  cardPaymentMethodId?: string;
  recipientId?: string;
  senderId?: string;
  transferId?: string;
  transferRateId?: string;
  directTransferId?: string;
  virtualAccountId?: string;
  chargeId?: string;
  disputableChargeId?: string;
  orderId?: string;
  settlementId?: string;
}

class StepSkippedError extends Error {
  constructor(message: string, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = 'StepSkippedError';
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isEnabled(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

function summarizeItems<T>(items: T[] | undefined, mapper: (item: T) => Record<string, unknown>): Array<Record<string, unknown>> {
  return (items ?? []).slice(0, 3).map(mapper);
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function skip(message: string, details?: Record<string, unknown>): never {
  throw new StepSkippedError(message, details);
}

function createReference(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function summarizeApiError(error: FlutterwaveAPIError): Record<string, unknown> {
  return {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    type: error.type,
    validationErrors: error.validationErrors,
    details: error.details,
  };
}

function logStep(status: StepStatus, name: string, details?: Record<string, unknown>): void {
  const prefix = status === 'passed' ? 'PASS' : status === 'skipped' ? 'SKIP' : 'FAIL';

  if (!details || Object.keys(details).length === 0) {
    console.log(`[${prefix}] ${name}`);
    return;
  }

  console.log(`[${prefix}] ${name}`, details);
}

async function runStep<T>(
  reports: StepReport[],
  name: string,
  action: () => Promise<T>,
  summarize?: (value: T) => Record<string, unknown> | undefined,
): Promise<T | undefined> {
  try {
    const value = await action();
    const details = summarize?.(value);
    reports.push({ name, status: 'passed', details });
    logStep('passed', name, details);
    return value;
  } catch (error: unknown) {
    if (error instanceof StepSkippedError) {
      const details = {
        reason: error.message,
        ...(error.details ?? {}),
      };
      reports.push({ name, status: 'skipped', details });
      logStep('skipped', name, details);
      return undefined;
    }

    if (error instanceof FlutterwaveAPIError) {
      const details = summarizeApiError(error);
      reports.push({ name, status: 'failed', details });
      logStep('failed', name, details);
      return undefined;
    }

    if (error instanceof Error) {
      const details = { message: error.message };
      reports.push({ name, status: 'failed', details });
      logStep('failed', name, details);
      return undefined;
    }

    const details = { error };
    reports.push({ name, status: 'failed', details });
    logStep('failed', name, details);
    return undefined;
  }
}

function createCustomerPayload(email: string) {
  return {
    email,
    name: {
      first: 'SDK',
      middle: 'Sandbox',
      last: 'Runner',
    },
    address: {
      line1: '221B Baker Street',
      city: 'Gotham',
      state: 'Colorado',
      country: 'US',
      postal_code: '94105',
    },
    phone: {
      country_code: '1',
      number: '6313958745',
    },
  };
}

function createCardPaymentMethodPayload(encryptionKey: string, customerId?: string) {
  const nonce = generateNonce();

  return {
    type: 'card' as const,
    customer_id: customerId,
    card: {
      nonce,
      encrypted_card_number: encryptPayload('5531886652142950', encryptionKey, nonce).encryptedData,
      encrypted_expiry_month: encryptPayload('09', encryptionKey, nonce).encryptedData,
      encrypted_expiry_year: encryptPayload('32', encryptionKey, nonce).encryptedData,
      encrypted_cvv: encryptPayload('564', encryptionKey, nonce).encryptedData,
      billing_address: {
        line1: '221B Baker Street',
        city: 'Gotham',
        state: 'Colorado',
        country: 'US',
        postal_code: '94105',
      },
      card_holder_name: 'SDK Sandbox Runner',
    },
  };
}

function createEncryptedPinAuthorization(encryptionKey: string, pin: string) {
  const nonce = generateNonce();

  return {
    type: 'pin' as const,
    pin: {
      nonce,
      encrypted_pin: encryptPayload(pin, encryptionKey, nonce).encryptedData,
    },
  };
}

function printSummary(reports: StepReport[]): void {
  const passed = reports.filter((report) => report.status === 'passed').length;
  const skipped = reports.filter((report) => report.status === 'skipped').length;
  const failed = reports.filter((report) => report.status === 'failed').length;

  console.log('');
  console.log('Sandbox endpoint exercise summary:', { passed, skipped, failed, total: reports.length });
}

async function run(): Promise<void> {
  const clientId = requireEnv('FLW_CLIENT_ID');
  const clientSecret = requireEnv('FLW_CLIENT_SECRET');
  const environment = (process.env.FLW_ENVIRONMENT ?? 'sandbox') as FlutterwaveEnvironment;
  const allowNonSandbox = isEnabled(process.env.FLW_ALLOW_NON_SANDBOX);
  const runWriteTests = isEnabled(process.env.FLW_RUN_WRITE_TESTS);
  const country = process.env.FLW_TEST_COUNTRY ?? 'NG';
  const currency = process.env.FLW_TEST_CURRENCY ?? 'NGN';
  const bankCode = process.env.FLW_TEST_BANK_CODE ?? '044';
  const accountNumber = process.env.FLW_TEST_ACCOUNT_NUMBER ?? '0690000031';
  const walletIdentifier = optionalEnv('FLW_TEST_WALLET_IDENTIFIER');
  const encryptionKey = optionalEnv('FLW_ENCRYPTION_KEY');
  const testAmount = Number(process.env.FLW_TEST_AMOUNT ?? '1000');
  const reports: StepReport[] = [];
  const context: SandboxContext = {};

  if (environment !== 'sandbox' && !allowNonSandbox) {
    throw new Error('Refusing to run outside sandbox. Set FLW_ALLOW_NON_SANDBOX=true to override this guard intentionally.');
  }

  if (!Number.isFinite(testAmount) || testAmount <= 0) {
    throw new Error('FLW_TEST_AMOUNT must be a positive number.');
  }

  const client = new FlutterwaveClient({
    clientId,
    clientSecret,
    environment,
  });

  console.log(`Running Flutterwave SDK endpoint exercise against ${environment}.`);
  console.log('Write steps enabled:', runWriteTests);

  const banks = await runStep(
    reports,
    'banks.list',
    () => client.banks.list({ country, currency }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (bank) => ({ id: bank.id, code: bank.code, name: bank.name })),
    }),
  );

  await runStep(
    reports,
    'banks.getBranches',
    async () => {
      const bankId = banks?.data[0]?.id;

      if (!bankId) {
        skip('No bank ID available from banks.list().');
      }

      return client.banks.getBranches(bankId, { country });
    },
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (branch) => ({ id: branch.id, branch_code: branch.branch_code, name: branch.name })),
    }),
  );

  await runStep(
    reports,
    'banks.resolveAccount',
    () =>
      client.banks.resolveAccount({
        currency,
        account: {
          number: accountNumber,
          code: bankCode,
        },
      }),
    (response) => ({
      account_name: response.data.account_name,
      account_number: response.data.account_number,
      bank_code: response.data.bank_code,
    }),
  );

  await runStep(
    reports,
    'mobileNetworks.list',
    () => client.mobileNetworks.list({ country }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (network) => ({ id: network.id, code: network.code, name: network.name })),
    }),
  );

  await runStep(
    reports,
    'fees.get',
    async () => {
      try {
        return await client.fees.get({
          amount: testAmount,
          currency,
          payment_method: 'card',
        });
      } catch (error: unknown) {
        if (error instanceof FlutterwaveAPIError && error.statusCode === 501) {
          skip('The fees endpoint currently returns 501 in Flutterwave sandbox for this payload.', {
            statusCode: error.statusCode,
            code: error.code,
          });
        }

        throw error;
      }
    },
    (response) => ({
      fee: response.data.fee,
      fee_type: response.data.fee_type,
      currency: response.data.currency,
    }),
  );

  await runStep(
    reports,
    'wallets.getBalances',
    () => client.wallets.getBalances(),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (balance) => ({ currency: balance.currency, available_balance: balance.available_balance })),
    }),
  );

  await runStep(
    reports,
    'wallets.getBalance',
    () => client.wallets.getBalance(currency),
    (response) => ({
      currency: response.data.currency,
      available_balance: response.data.available_balance,
    }),
  );

  await runStep(
    reports,
    'wallets.getStatement',
    async () => {
      try {
        return await client.wallets.getStatement({
          currency,
          size: 10,
          from: formatDateOnly(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
          to: formatDateOnly(new Date()),
        });
      } catch (error: unknown) {
        if (
          error instanceof FlutterwaveAPIError &&
          error.statusCode === 404 &&
          (error.code === '301404' || error.type === 'TRANSFER_NOT_FOUND')
        ) {
          skip('The sandbox wallet has no statement entries for the selected range yet.', {
            statusCode: error.statusCode,
            code: error.code,
          });
        }

        throw error;
      }
    },
    (response) => ({
      count: response.data.transactions?.length ?? 0,
      cursor: response.data.cursor,
    }),
  );

  await runStep(
    reports,
    'wallets.resolveAccount',
    async () => {
      if (!walletIdentifier) {
        skip('Set FLW_TEST_WALLET_IDENTIFIER to exercise wallet account resolution.');
      }

      return client.wallets.resolveAccount({
        provider: 'flutterwave',
        identifier: walletIdentifier,
      });
    },
    (response) => ({
      provider: response.data.provider,
      identifier: response.data.identifier,
      name: response.data.name,
    }),
  );

  const customers = await runStep(
    reports,
    'customers.list',
    () => client.customers.list({ limit: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (customer) => ({ id: customer.id, email: customer.email, name: customer.name })),
    }),
  );

  if (!runWriteTests) {
    context.customerId = String(customers?.data[0]?.id ?? '');
    context.customerEmail = customers?.data[0]?.email;

    if (!context.customerId) {
      context.customerId = undefined;
    }
  }

  const createdCustomer = await runStep(
    reports,
    'customers.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create sandbox records.');
      }

      const email = `sdk-sandbox-${Date.now()}@example.com`;
      return client.customers.create(createCustomerPayload(email));
    },
    (response) => ({ id: response.data.id, email: response.data.email, name: response.data.name }),
  );

  if (createdCustomer?.data.id) {
    context.customerId = String(createdCustomer.data.id);
    context.customerEmail = createdCustomer.data.email;
  }

  await runStep(
    reports,
    'customers.get',
    async () => {
      if (!context.customerId) {
        skip('No customer ID is available. Create one or ensure customers.list() returns data.');
      }

      return client.customers.get(context.customerId);
    },
    (response) => ({ id: response.data.id, email: response.data.email, name: response.data.name }),
  );

  await runStep(
    reports,
    'customers.search',
    async () => {
      if (!context.customerEmail) {
        skip('No customer email is available for search.');
      }

      return client.customers.search({ email: context.customerEmail });
    },
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (customer) => ({ id: customer.id, email: customer.email, name: customer.name })),
    }),
  );

  await runStep(
    reports,
    'customers.update',
    async () => {
      if (!runWriteTests) {
        skip('Customer updates are disabled while write tests are off.');
      }

      if (!context.customerId) {
        skip('No customer ID is available for update.');
      }

      return client.customers.update(context.customerId, {
        phone: {
          country_code: '1',
          number: '6313958746',
        },
        meta: {
          source: 'sandbox-example',
        },
      });
    },
    (response) => ({ id: response.data.id, phone: response.data.phone, meta: response.data.meta }),
  );

  const paymentMethods = await runStep(
    reports,
    'paymentMethods.list',
    () => client.paymentMethods.list({ page: 1, size: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (paymentMethod) => ({ id: paymentMethod.id, type: paymentMethod.type, customer_id: paymentMethod.customer_id })),
    }),
  );

  if (!runWriteTests) {
    const listedMethods = paymentMethods?.data ?? [];
    const listedOpayMethod = listedMethods.find((paymentMethod) => paymentMethod.type === 'opay');
    const listedCardMethod = listedMethods.find((paymentMethod) => paymentMethod.type === 'card');

    context.opayPaymentMethodId = listedOpayMethod?.id ? String(listedOpayMethod.id) : undefined;
    context.cardPaymentMethodId = listedCardMethod?.id ? String(listedCardMethod.id) : undefined;
    context.paymentMethodId = context.opayPaymentMethodId ?? context.cardPaymentMethodId;
  }

  const createdPaymentMethod = await runStep(
    reports,
    'paymentMethods.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create payment methods.');
      }

      return client.paymentMethods.create({
        type: 'opay',
        customer_id: context.customerId,
      });
    },
    (response) => ({ id: response.data.id, type: response.data.type, customer_id: response.data.customer_id }),
  );

  if (createdPaymentMethod?.data.id) {
    context.opayPaymentMethodId = String(createdPaymentMethod.data.id);
    context.paymentMethodId = context.opayPaymentMethodId;
  }

  await runStep(
    reports,
    'paymentMethods.get',
    async () => {
      if (!context.paymentMethodId) {
        skip('No payment method ID is available.');
      }

      return client.paymentMethods.get(context.paymentMethodId);
    },
    (response) => ({ id: response.data.id, type: response.data.type, customer_id: response.data.customer_id }),
  );

  await runStep(
    reports,
    'paymentMethods.create(card)',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create card payment methods.');
      }

      if (!encryptionKey) {
        skip('Set FLW_ENCRYPTION_KEY to exercise encrypted card payment method creation.');
      }

      try {
        return await client.paymentMethods.create(createCardPaymentMethodPayload(encryptionKey, context.customerId));
      } catch (error: unknown) {
        if (error instanceof FlutterwaveAPIError && error.code === '1137400') {
          skip('The supplied FLW_ENCRYPTION_KEY could not be used by Flutterwave sandbox to decrypt card fields.', {
            statusCode: error.statusCode,
            code: error.code,
          });
        }

        throw error;
      }
    },
    (response) => {
      if (response.data.id) {
        context.cardPaymentMethodId = String(response.data.id);
      }

      return { id: response.data.id, type: response.data.type, customer_id: response.data.customer_id };
    },
  );

  const recipientList = await runStep(
    reports,
    'transferRecipients.list',
    () => client.transferRecipients.list({ size: 10 }),
    (response) => ({
      count: response.data.recipients?.length ?? 0,
      cursor: response.data.cursor,
    }),
  );

  if (!context.recipientId) {
    context.recipientId = recipientList?.data.recipients?.[0]?.id;
  }

  const createdRecipient = await runStep(
    reports,
    'transferRecipients.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create transfer recipients.');
      }

      try {
        return await client.transferRecipients.create({
          type: 'bank_ngn',
          bank: {
            account_number: accountNumber,
            code: bankCode,
          },
        });
      } catch (error: unknown) {
        if (
          error instanceof FlutterwaveAPIError &&
          error.statusCode === 409 &&
          error.code === '270409' &&
          context.recipientId
        ) {
          skip('An equivalent transfer recipient already exists in this sandbox account.', {
            recipientId: context.recipientId,
          });
        }

        throw error;
      }
    },
    (response) => ({ id: response.data.id, type: response.data.type, name: response.data.name }),
  );

  if (createdRecipient?.data.id) {
    context.recipientId = String(createdRecipient.data.id);
  }

  await runStep(
    reports,
    'transferRecipients.get',
    async () => {
      if (!context.recipientId) {
        skip('No transfer recipient ID is available.');
      }

      return client.transferRecipients.get(context.recipientId);
    },
    (response) => ({ id: response.data.id, type: response.data.type, name: response.data.name }),
  );

  const senderList = await runStep(
    reports,
    'transferSenders.list',
    () => client.transferSenders.list({ size: 10 }),
    (response) => ({
      count: response.data.senders?.length ?? 0,
      cursor: response.data.cursor,
    }),
  );

  if (!runWriteTests) {
    context.senderId = senderList?.data.senders?.[0]?.id;
  }

  const createdSender = await runStep(
    reports,
    'transferSenders.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create transfer senders.');
      }

      return client.transferSenders.create({
        type: 'generic_sender',
        name: {
          first: 'Grace',
          last: 'Hopper',
        },
        email: 'sender@example.com',
      });
    },
    (response) => ({ id: response.data.id, type: response.data.type, name: response.data.name }),
  );

  if (createdSender?.data.id) {
    context.senderId = String(createdSender.data.id);
  }

  await runStep(
    reports,
    'transferSenders.get',
    async () => {
      if (!context.senderId) {
        skip('No transfer sender ID is available.');
      }

      return client.transferSenders.get(context.senderId);
    },
    (response) => ({ id: response.data.id, type: response.data.type, name: response.data.name }),
  );

  const transferRate = await runStep(
    reports,
    'transferRates.create',
    () =>
      client.transferRates.create({
        source: {
          currency,
        },
        destination: {
          currency,
          amount: testAmount,
        },
      }),
    (response) => ({
      id: response.data.id,
      source_currency: response.data.source_currency,
      destination_currency: response.data.destination_currency,
      rate: response.data.rate,
    }),
  );

  if (transferRate?.data.id) {
    context.transferRateId = String(transferRate.data.id);
  }

  await runStep(
    reports,
    'transferRates.get',
    async () => {
      if (!context.transferRateId) {
        skip('No transfer rate ID is available.');
      }

      return client.transferRates.get(context.transferRateId);
    },
    (response) => ({
      id: response.data.id,
      source_currency: response.data.source_currency,
      destination_currency: response.data.destination_currency,
      rate: response.data.rate,
    }),
  );

  const transferList = await runStep(
    reports,
    'transfers.list',
    () => client.transfers.list({ size: 10 }),
    (response) => ({
      count: response.data.transfers?.length ?? 0,
      cursor: response.data.cursor,
    }),
  );

  if (!runWriteTests) {
    context.transferId = transferList?.data.transfers?.[0]?.id != null ? String(transferList.data.transfers[0].id) : undefined;
  }

  const createdTransfer = await runStep(
    reports,
    'transfers.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create transfers.');
      }

      if (!context.recipientId) {
        skip('Create a recipient first before creating a transfer.');
      }

      return client.transfers.create(
        {
          action: 'instant',
          reference: createReference('sdk-transfer'),
          narration: 'SDK sandbox transfer',
          payment_instruction: {
            source_currency: currency,
            destination_currency: currency,
            recipient_id: context.recipientId,
            sender_id: context.senderId,
            amount: {
              value: testAmount,
              applies_to: 'destination_currency',
            },
          },
        },
        { scenarioKey: 'scenario:successful' },
      );
    },
    (response) => ({ id: response.data.id, status: response.data.status, recipient_id: response.data.recipient_id }),
  );

  if (createdTransfer?.data.id) {
    context.transferId = String(createdTransfer.data.id);
  }

  const fetchedTransfer = await runStep(
    reports,
    'transfers.get',
    async () => {
      if (!context.transferId) {
        skip('No transfer ID is available.');
      }

      return client.transfers.get(context.transferId);
    },
    (response) => ({ id: response.data.id, status: response.data.status, fee: response.data.fee }),
  );

  await runStep(
    reports,
    'transfers.update',
    async () => {
      if (!context.transferId) {
        skip('No transfer ID is available for update.');
      }

      const status = fetchedTransfer?.data.status;

      if (status && !['NEW', 'PENDING', 'INITIATED'].includes(status)) {
        skip('Transfer update depends on a mutable transfer lifecycle state.', { status });
      }

      return client.transfers.update(context.transferId, {
        callback_url: 'https://example.com/flutterwave/transfer-callback',
        meta: {
          source: 'sandbox-example',
        },
      });
    },
    (response) => ({ id: response.data.id, status: response.data.status, updated_datetime: response.data.updated_datetime }),
  );

  await runStep(
    reports,
    'transfers.retry',
    async () => {
      if (!context.transferId) {
        skip('No transfer ID is available for retry.');
      }

      const status = fetchedTransfer?.data.status;

      if (status && !['FAILED', 'CANCELLED'].includes(status)) {
        skip('Transfer retry is only valid for failed or cancelled transfers.', { status });
      }

      return client.transfers.retry(context.transferId, {
        action: 'retry',
        reference: createReference('sdk-transfer-retry'),
      });
    },
    (response) => ({ id: response.data.id, status: response.data.status }),
  );

  const directTransfer = await runStep(
    reports,
    'directTransfers.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create direct transfers.');
      }

      return client.directTransfers.create(
        {
          type: 'bank',
          action: 'instant',
          reference: createReference('sdk-direct-transfer'),
          narration: 'SDK sandbox direct transfer',
          payment_instruction: {
            source_currency: currency,
            destination_currency: currency,
            amount: {
              value: testAmount,
              applies_to: 'destination_currency',
            },
            recipient: {
              bank: {
                account_number: accountNumber,
                code: bankCode,
              },
            },
          },
        },
        { scenarioKey: 'scenario:successful' },
      );
    },
    (response) => ({ id: response.data.id, status: response.data.status, fee: response.data.fee }),
  );

  if (directTransfer?.data.id) {
    context.directTransferId = String(directTransfer.data.id);
  }

  const settlements = await runStep(
    reports,
    'settlements.list',
    () => client.settlements.list({ page: 1, size: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (settlement) => ({ id: settlement.id, currency: settlement.currency, status: settlement.status })),
    }),
  );

  context.settlementId = settlements?.data[0]?.id != null ? String(settlements.data[0].id) : undefined;

  await runStep(
    reports,
    'settlements.get',
    async () => {
      if (!context.settlementId) {
        skip('No settlement is available in this sandbox account yet.');
      }

      try {
        return await client.settlements.get(context.settlementId);
      } catch (error: unknown) {
        if (error instanceof FlutterwaveAPIError && error.statusCode === 400 && error.code === '10400') {
          skip('The settlements.get endpoint returned a sandbox validation error for a settlement ID returned by settlements.list.', {
            settlementId: context.settlementId,
            code: error.code,
          });
        }

        throw error;
      }
    },
    (response) => ({ id: response.data.id, gross_amount: response.data.gross_amount, net_amount: response.data.net_amount }),
  );

  const charges = await runStep(
    reports,
    'charges.list',
    () => client.charges.list({ page: 1, size: 10, customer_id: context.customerId }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (charge) => ({ id: charge.id, status: charge.status, payment_reference: charge.reference })),
    }),
  );

  if (!runWriteTests) {
    context.chargeId = charges?.data[0]?.id;
  }

  const createdCharge = await runStep(
    reports,
    'charges.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create charges.');
      }

      if (!context.customerId || !context.cardPaymentMethodId) {
        skip('charges.create requires a saved customer ID and card payment method ID.', {
          customerId: context.customerId,
          cardPaymentMethodId: context.cardPaymentMethodId,
        });
      }

      if (!encryptionKey) {
        skip('Set FLW_ENCRYPTION_KEY to exercise PIN-authorized card charges.');
      }

      return client.charges.create(
        {
          amount: testAmount,
          currency,
          reference: createReference('sdk-charge'),
          customer_id: context.customerId,
          payment_method_id: context.cardPaymentMethodId,
          redirect_url: 'https://example.com/flutterwave/charge-redirect',
          authorization: createEncryptedPinAuthorization(encryptionKey, '12345'),
        },
        { scenarioKey: 'scenario:auth_pin&issuer:approved' },
      );
    },
    (response) => ({ id: response.data.id, status: response.data.status, reference: response.data.reference }),
  );

  if (createdCharge?.data.id) {
    context.chargeId = String(createdCharge.data.id);
    context.disputableChargeId = String(createdCharge.data.id);
  }

  let chargeState = await runStep(
    reports,
    'charges.get',
    async () => {
      if (!context.chargeId) {
        skip('No charge ID is available.');
      }

      return client.charges.get(context.chargeId);
    },
    (response) => ({ id: response.data.id, status: response.data.status, next_action: response.data.next_action }),
  );

  await runStep(
    reports,
    'charges.update',
    async () => {
      if (!context.chargeId) {
        skip('No charge ID is available for update.');
      }

      const nextActionType = chargeState?.data.next_action?.type;

      if (!nextActionType || !['requires_pin', 'requires_otp', 'requires_additional_fields'].includes(nextActionType)) {
        skip('charges.update is only meaningful for follow-up authorization flows.', {
          status: chargeState?.data.status,
          nextActionType,
        });
      }

      if (nextActionType === 'requires_pin') {
        if (!encryptionKey) {
          skip('Set FLW_ENCRYPTION_KEY to submit encrypted PIN authorization updates.');
        }

        const updatedCharge = await client.charges.update(context.chargeId, {
          authorization: createEncryptedPinAuthorization(encryptionKey, '12345'),
        });

        chargeState = updatedCharge;
        return updatedCharge;
      }

      if (nextActionType === 'requires_otp') {
        const updatedCharge = await client.charges.update(context.chargeId, {
          authorization: {
            type: 'otp',
            otp: {
              code: '123456',
            },
          },
        });

        chargeState = updatedCharge;
        return updatedCharge;
      }

      const updatedCharge = await client.charges.update(context.chargeId, {
        authorization: {
          type: 'avs',
          avs: {
            address: {
              city: 'Gotham',
              country: 'US',
              line1: '221B Baker Street',
              line2: 'Coker Estate',
              postal_code: '94105',
              state: 'Colorado',
            },
          },
        },
      });

      chargeState = updatedCharge;
      return updatedCharge;
    },
    (response) => ({ id: response.data.id, status: response.data.status, next_action: response.data.next_action }),
  );

  if (chargeState?.data.id) {
    context.disputableChargeId = String(chargeState.data.id);
  }

  let finalizedChargeState = chargeState;

  if (chargeState?.data.next_action?.type === 'requires_otp') {
    finalizedChargeState = await runStep(
      reports,
      'charges.update(otp)',
      async () => {
        if (!context.chargeId) {
          skip('No charge ID is available for OTP authorization.');
        }

        return client.charges.update(context.chargeId, {
          authorization: {
            type: 'otp',
            otp: {
              code: '123456',
            },
          },
        });
      },
      (response) => ({ id: response.data.id, status: response.data.status, next_action: response.data.next_action }),
    );

    if (finalizedChargeState?.data.id) {
      context.disputableChargeId = String(finalizedChargeState.data.id);
    }
  }

  const orders = await runStep(
    reports,
    'orders.list',
    () => client.orders.list({ page: 1, size: 10, customer_id: context.customerId }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (order) => ({ id: order.id, status: order.status, reference: order.reference })),
    }),
  );

  if (!runWriteTests) {
    context.orderId = orders?.data[0]?.id != null ? String(orders.data[0].id) : undefined;
  }

  const createdOrder = await runStep(
    reports,
    'orders.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create orders.');
      }

      if (!context.customerId || !context.cardPaymentMethodId) {
        skip('orders.create requires a saved customer ID and card payment method ID.', {
          customerId: context.customerId,
          cardPaymentMethodId: context.cardPaymentMethodId,
        });
      }

      return client.orders.create({
        amount: testAmount,
        currency,
        reference: createReference('sdk-order'),
        customer_id: context.customerId,
        payment_method_id: context.cardPaymentMethodId,
        redirect_url: 'https://example.com/flutterwave/order-redirect',
      });
    },
    (response) => ({ id: response.data.id, status: response.data.status, reference: response.data.reference }),
  );

  if (createdOrder?.data.id) {
    context.orderId = String(createdOrder.data.id);
  }

  const fetchedOrder = await runStep(
    reports,
    'orders.get',
    async () => {
      if (!context.orderId) {
        skip('No order ID is available.');
      }

      return client.orders.get(context.orderId);
    },
    (response) => ({ id: response.data.id, status: response.data.status, reference: response.data.reference }),
  );

  await runStep(
    reports,
    'orders.update',
    async () => {
      if (!context.orderId) {
        skip('No order ID is available for update.');
      }

      const status = fetchedOrder?.data.status;

      if (!status || !['pending', 'authorized'].includes(status)) {
        skip('orders.update is only meaningful for orders that can still be captured or voided.', { status });
      }

      return client.orders.update(context.orderId, { action: 'void' });
    },
    (response) => ({ id: response.data.id, status: response.data.status, updated_datetime: response.data.updated_datetime }),
  );

  await runStep(
    reports,
    'orchestration.createDirectCharge',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create orchestration direct charges.');
      }

      return client.orchestration.createDirectCharge({
        amount: testAmount,
        currency,
        reference: createReference('sdk-orch-charge'),
        redirect_url: 'https://example.com/flutterwave/orchestration-charge',
        customer: createCustomerPayload(`orchestration-charge-${Date.now()}@example.com`),
        payment_method: {
          type: 'opay',
        },
      });
    },
    (response) => ({ id: response.data.id, status: response.data.status, reference: response.data.reference }),
  );

  await runStep(
    reports,
    'orchestration.createDirectOrder',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create orchestration direct orders.');
      }

      if (!encryptionKey) {
        skip('Set FLW_ENCRYPTION_KEY to exercise orchestration direct orders with a card payload.');
      }

      try {
        return await client.orchestration.createDirectOrder({
          amount: testAmount,
          currency,
          reference: createReference('sdk-orch-order'),
          redirect_url: 'https://example.com/flutterwave/orchestration-order',
          customer: createCustomerPayload(`orchestration-order-${Date.now()}@example.com`),
          payment_method: createCardPaymentMethodPayload(encryptionKey),
        });
      } catch (error: unknown) {
        if (error instanceof FlutterwaveAPIError && error.code === '1137400') {
          skip('The supplied FLW_ENCRYPTION_KEY could not be used by Flutterwave sandbox to decrypt orchestration card fields.', {
            statusCode: error.statusCode,
            code: error.code,
          });
        }

        throw error;
      }
    },
    (response) => ({ id: response.data.id, status: response.data.status, reference: response.data.reference }),
  );

  const virtualAccounts = await runStep(
    reports,
    'virtualAccounts.list',
    () => client.virtualAccounts.list({ page: 1, size: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (account) => ({ id: account.id, status: account.status, reference: account.reference })),
    }),
  );

  if (!runWriteTests) {
    context.virtualAccountId = virtualAccounts?.data[0]?.id;
  }

  const createdVirtualAccount = await runStep(
    reports,
    'virtualAccounts.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create virtual accounts.');
      }

      if (!context.customerId) {
        skip('A customer is required to create a virtual account.');
      }

      return client.virtualAccounts.create(
        {
          customer_id: context.customerId,
          amount: testAmount,
          reference: createReference('sdk-virtual-account'),
          currency,
          account_type: 'static',
          narration: 'SDK sandbox virtual account',
          bvn: currency === 'NGN' ? '12345678912' : undefined,
        },
        { scenarioKey: 'issuer:approved' },
      );
    },
    (response) => ({ id: response.data.id, status: response.data.status, account_number: response.data.account_number }),
  );

  if (createdVirtualAccount?.data.id) {
    context.virtualAccountId = String(createdVirtualAccount.data.id);
  }

  await runStep(
    reports,
    'virtualAccounts.get',
    async () => {
      if (!context.virtualAccountId) {
        skip('No virtual account ID is available.');
      }

      return client.virtualAccounts.get(context.virtualAccountId);
    },
    (response) => ({ id: response.data.id, status: response.data.status, account_number: response.data.account_number }),
  );

  await runStep(
    reports,
    'virtualAccounts.update',
    async () => {
      if (!runWriteTests) {
        skip('Virtual account updates are disabled while write tests are off.');
      }

      if (!context.virtualAccountId) {
        skip('No virtual account ID is available for update.');
      }

      return client.virtualAccounts.update(context.virtualAccountId, {
        action_type: 'update_status',
        status: 'inactive',
      });
    },
    (response) => ({ id: response.data.id, status: response.data.status }),
  );

  const refunds = await runStep(
    reports,
    'refunds.list',
    () => client.refunds.list({ page: 1, size: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (refund) => ({ id: refund.id, charge_id: refund.charge_id, status: refund.status })),
    }),
  );

  const createdRefund = await runStep(
    reports,
    'refunds.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create refunds.');
      }

      if (!context.chargeId) {
        skip('Create a charge first before attempting a refund.');
      }

      const targetChargeId = context.disputableChargeId ?? context.chargeId;

      if (!targetChargeId) {
        skip('No successful card-backed charge is available for refund creation.');
      }

      if (finalizedChargeState?.data.status !== 'succeeded') {
        skip('Refund creation requires a successful charge. The latest sandbox charge is not in a refundable state yet.', {
          chargeId: targetChargeId,
          chargeStatus: finalizedChargeState?.data.status,
        });
      }

      return client.refunds.create({
        charge_id: targetChargeId,
        amount: testAmount,
        reason: 'requested_by_customer',
      });
    },
    (response) => ({ id: response.data.id, charge_id: response.data.charge_id, status: response.data.status }),
  );

  const refundId = createdRefund?.data.id ?? refunds?.data[0]?.id;

  await runStep(
    reports,
    'refunds.get',
    async () => {
      if (!refundId) {
        skip('No refund is available to retrieve yet.');
      }

      return client.refunds.get(refundId);
    },
    (response) => ({ id: response.data.id, charge_id: response.data.charge_id, status: response.data.status }),
  );

  const chargebacks = await runStep(
    reports,
    'chargebacks.list',
    () => client.chargebacks.list({ page: 1, size: 10 }),
    (response) => ({
      count: response.data.length,
      sample: summarizeItems(response.data, (chargeback) => ({ id: chargeback.id, charge_id: chargeback.charge_id, status: chargeback.status })),
    }),
  );

  const createdChargeback = await runStep(
    reports,
    'chargebacks.create',
    async () => {
      if (!runWriteTests) {
        skip('Set FLW_RUN_WRITE_TESTS=true to create chargebacks.');
      }

      if (!context.chargeId) {
        skip('Create a charge first before attempting a chargeback.');
      }

      const targetChargeId = context.disputableChargeId ?? context.chargeId;

      if (!targetChargeId) {
        skip('No successful card-backed charge is available for chargeback creation.');
      }

      if (finalizedChargeState?.data.status !== 'succeeded') {
        skip('Chargeback creation requires a successful charge. The latest sandbox charge is not in a disputable state yet.', {
          chargeId: targetChargeId,
          chargeStatus: finalizedChargeState?.data.status,
        });
      }

      return client.chargebacks.create({
        charge_id: targetChargeId,
        amount: testAmount,
        expiry: 72,
        type: 'local',
        comment: 'SDK sandbox chargeback test',
      });
    },
    (response) => ({ id: response.data.id, charge_id: response.data.charge_id, stage: response.data.stage, status: response.data.status }),
  );

  const chargebackId = createdChargeback?.data.id ?? chargebacks?.data[0]?.id;

  await runStep(
    reports,
    'chargebacks.get',
    async () => {
      if (!chargebackId) {
        skip('No chargeback is available to retrieve yet.');
      }

      return client.chargebacks.get(chargebackId);
    },
    (response) => ({ id: response.data.id, charge_id: response.data.charge_id, stage: response.data.stage, status: response.data.status }),
  );

  await runStep(
    reports,
    'chargebacks.update',
    async () => {
      if (!chargebackId) {
        skip('No chargeback is available to update yet.');
      }

      return client.chargebacks.update(chargebackId, {
        status: 'accepted',
        comment: 'SDK sandbox chargeback update',
      });
    },
    (response) => ({ id: response.data.id, stage: response.data.stage, status: response.data.status }),
  );

  await runStep(
    reports,
    'transferRecipients.delete',
    async () => {
      if (!runWriteTests) {
        skip('Recipient deletion is disabled while write tests are off.');
      }

      if (!createdRecipient?.data.id) {
        skip('No disposable transfer recipient was created in this run.');
      }

      return client.transferRecipients.delete(createdRecipient.data.id);
    },
    (response) => ({ id: response?.data?.id, deleted: response?.data?.deleted ?? true }),
  );

  await runStep(
    reports,
    'transferSenders.delete',
    async () => {
      if (!runWriteTests) {
        skip('Sender deletion is disabled while write tests are off.');
      }

      if (!createdSender?.data.id) {
        skip('No disposable transfer sender was created in this run.');
      }

      return client.transferSenders.delete(createdSender.data.id);
    },
    (response) => ({ id: response?.data?.id, deleted: response?.data?.deleted ?? true }),
  );

  printSummary(reports);

  if (reports.some((report) => report.status === 'failed')) {
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  if (error instanceof FlutterwaveAPIError) {
    console.error('Flutterwave API error:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      type: error.type,
      validationErrors: error.validationErrors,
      details: error.details,
    });
    process.exitCode = 1;
    return;
  }

  if (error instanceof Error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  console.error('Unknown error', error);
  process.exitCode = 1;
});