// Mock Payment Service Abstraction for TZA Mart POS

export type PaymentOption = 'Cash' | 'Mobile Money' | 'Card / Bank';
export type MobileMoneyProvider = 'M-Pesa' | 'Airtel Money' | 'Mixx by Yas' | 'HaloPesa';
export type PaymentState = 'Pending' | 'Processing' | 'Success' | 'Failed';

export interface CashPaymentPayload {
  amountReceived: number;
  totalAmount: number;
}

export interface MobileMoneyPaymentPayload {
  provider: MobileMoneyProvider;
  phone: string;
  amount: number;
}

export interface CardPaymentPayload {
  reference: string;
  amount: number;
}

export interface PaymentResult {
  status: 'Success' | 'Failed';
  transactionRef?: string;
  change?: number;
  errorMessage?: string;
  provider?: MobileMoneyProvider;
  phone?: string;
  reference?: string;
}

class MockPaymentService {
  /**
   * Process Cash Payment
   */
  async processCash({ amountReceived, totalAmount }: CashPaymentPayload): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 400)); // Simulate micro delay

    if (amountReceived < totalAmount) {
      return {
        status: 'Failed',
        errorMessage: `Insufficient cash amount. Received TZS ${amountReceived.toLocaleString()}, but total is TZS ${totalAmount.toLocaleString()}.`,
      };
    }

    const change = amountReceived - totalAmount;
    return {
      status: 'Success',
      transactionRef: `CSH-${Math.floor(100000 + Math.random() * 900000)}`,
      change,
    };
  }

  /**
   * Process Mobile Money Payment (M-Pesa, Airtel Money, Mixx by Yas, HaloPesa)
   */
  async processMobileMoney(
    payload: MobileMoneyPaymentPayload,
    onStatusChange?: (state: PaymentState) => void
  ): Promise<PaymentResult> {
    onStatusChange?.('Pending');
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Basic Validation
    const cleanPhone = payload.phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      onStatusChange?.('Failed');
      return {
        status: 'Failed',
        errorMessage: 'Invalid mobile phone number. Please enter a valid 10-digit number.',
      };
    }

    onStatusChange?.('Processing');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulation Rule: Phone numbers ending with '999' trigger a payment failure (e.g. PIN timeout or insufficient funds)
    if (cleanPhone.endsWith('999')) {
      onStatusChange?.('Failed');
      return {
        status: 'Failed',
        errorMessage: `${payload.provider} Push Payment failed: Customer timed out or cancelled PIN prompt on ${payload.phone}.`,
      };
    }

    onStatusChange?.('Success');
    return {
      status: 'Success',
      provider: payload.provider,
      phone: payload.phone,
      transactionRef: `MM-${payload.provider.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    };
  }

  /**
   * Process Card / Bank POS Payment
   */
  async processCard(
    payload: CardPaymentPayload,
    onStatusChange?: (state: PaymentState) => void
  ): Promise<PaymentResult> {
    onStatusChange?.('Pending');
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!payload.reference.trim()) {
      onStatusChange?.('Failed');
      return {
        status: 'Failed',
        errorMessage: 'Payment reference or POS terminal authorization code is required.',
      };
    }

    onStatusChange?.('Processing');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Simulation Rule: Reference code starting with 'FAIL' triggers card failure
    if (payload.reference.trim().toUpperCase().startsWith('FAIL')) {
      onStatusChange?.('Failed');
      return {
        status: 'Failed',
        errorMessage: 'Card Payment Declined: Bank issuer declined transaction (Insufficient Funds / Expired Card).',
      };
    }

    onStatusChange?.('Success');
    return {
      status: 'Success',
      reference: payload.reference,
      transactionRef: `CRD-${payload.reference.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
  }
}

export const mockPaymentService = new MockPaymentService();
