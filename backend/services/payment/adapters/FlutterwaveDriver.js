import fetch from 'node-fetch';
import { PaymentDriver } from '../ports/PaymentDriver.js';

export class FlutterwaveDriver extends PaymentDriver {
  constructor(config) {
    super(config);
    this.secretKey = config.secretKey || process.env.FLUTTERWAVE_SECRET_KEY;
    this.baseUrl = config.baseUrl || 'https://api.flutterwave.com/v3';
    this.redirectUrl = config.redirectUrl;
  }

  async createOrder(data) {
    const endpoint = `${this.baseUrl}/payments`;
    const body = {
      tx_ref: data.orderId,
      amount: data.amount,
      currency: data.currency || 'USD',
      payment_options: 'card, banktransfer, mobilemoney, ussd, account, voucher',
      redirect_url: this.redirectUrl || `${process.env.APP_URL || 'https://idubbl-backend.onrender.com'}/api/payment/callback/flutterwave`,
      customer: {
        email: data.customer.email,
        phonenumber: data.customer.phone || '',
        name: data.customer.name || data.customer.email.split('@')[0],
      },
      customizations: {
        title: 'iDubbl Platform Deposit',
        description: data.description || 'iDubbl Wallet funding',
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        return {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          status: 'pending',
          paymentUrl: resData.data.link,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'Flutterwave payment initiation failed');
      }
    } catch (error) {
      console.error('Flutterwave createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId) {
    // Check if verification is by tx_ref (often returned in callback) or by numeric ID
    const isReference = isNaN(transactionId);
    const endpoint = isReference
      ? `${this.baseUrl}/transactions/verify_by_reference?tx_ref=${transactionId}`
      : `${this.baseUrl}/transactions/${transactionId}/verify`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        const txData = Array.isArray(resData.data) ? resData.data[0] : resData.data;
        const status = txData.status === 'successful' ? 'success' : 'failed';

        return {
          orderId: txData.tx_ref,
          status: status,
          transactionId: txData.id.toString(),
          amount: txData.amount,
          currency: txData.currency,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'Flutterwave transaction verification failed');
      }
    } catch (error) {
      console.error('Flutterwave verifyPayment error:', error);
      throw error;
    }
  }

  async handleWebhook(req) {
    const body = req.body;
    const event = body?.event || 'charge.completed';
    const txData = body?.data;

    return {
      orderId: txData?.tx_ref,
      status: txData?.status === 'successful' ? 'success' : 'failed',
      eventType: event,
      rawResponse: body,
    };
  }

  async initiateTransfer(data) {
    const endpoint = `${this.baseUrl}/transfers`;
    const body = {
      account_bank: data.bankCode || '044',
      account_number: data.accountNumber,
      amount: data.amount,
      narrative: data.narrative || 'iDubbl Payout',
      currency: data.currency || 'NGN',
      reference: data.reference,
      callback_url: `${process.env.APP_URL || 'https://idubbl-backend.onrender.com'}/api/payment/webhook`
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        return {
          success: true,
          transferId: resData.data.id.toString(),
          status: 'pending',
          rawResponse: resData
        };
      } else {
        throw new Error(resData.message || 'Flutterwave transfer initiation failed');
      }
    } catch (error) {
      console.error('Flutterwave initiateTransfer error:', error);
      throw error;
    }
  }
}
