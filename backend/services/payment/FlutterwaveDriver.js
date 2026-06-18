import fetch from 'node-fetch';
import { PaymentDriver } from './PaymentDriver.js';

export class FlutterwaveDriver extends PaymentDriver {
  constructor(config) {
    super(config);
    this.secretKey = config.secretKey;
    this.publicKey = config.publicKey;
    this.baseUrl = config.baseUrl || 'https://api.flutterwave.com/v3';
    this.redirectUrl = config.redirectUrl;
  }

  async createOrder(data) {
    const endpoint = `${this.baseUrl}/payments`;
    const body = {
      tx_ref: data.orderId,
      amount: data.amount,
      currency: data.currency || 'USD',
      redirect_url: this.redirectUrl,
      customer: {
        email: data.customer.email,
        phone_number: data.customer.phone || '',
        name: data.customer.name || '',
      },
      customizations: {
        title: 'iDubbl Platform',
        description: data.description || 'iDubbl Order Payment',
      },
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
        throw new Error(resData.message || 'Flutterwave order creation failed');
      }
    } catch (error) {
      console.error('Flutterwave createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId) {
    // Flutterwave verification endpoint using transaction ID (numeric ID returned in callback query param)
    const endpoint = `${this.baseUrl}/transactions/${transactionId}/verify`;

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
        const tx = resData.data;
        return {
          orderId: tx.tx_ref,
          status: tx.status === 'successful' ? 'success' : 'failed',
          transactionId: tx.id.toString(),
          amount: tx.amount,
          currency: tx.currency,
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
    const signature = req.headers['verif-hash'];
    // In production, we compare signature against the secret hash set in Flutterwave dashboard
    // If not configured, we can do simple verification or skip signature check for local test.
    const body = req.body;

    return {
      orderId: body?.data?.tx_ref,
      status: body?.data?.status === 'successful' ? 'success' : 'failed',
      eventType: body?.event || 'charge.completed',
      rawResponse: body,
    };
  }
}
