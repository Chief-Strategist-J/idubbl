import fetch from 'node-fetch';
import { PaymentDriver } from '../ports/PaymentDriver.js';

export class NOWPaymentsDriver extends PaymentDriver {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey || process.env.NOWPAYMENTS_API_KEY;
    this.baseUrl = config.baseUrl || 'https://api.nowpayments.io/v1';
    this.redirectUrl = config.redirectUrl;
  }

  async createOrder(data) {
    const endpoint = `${this.baseUrl}/invoice`;
    const body = {
      price_amount: data.amount,
      price_currency: data.currency ? data.currency.toLowerCase() : 'usd',
      ipn_callback_url: `${process.env.APP_URL || 'https://idubbl-backend.onrender.com'}/api/payment/webhook`,
      order_id: data.orderId,
      order_description: data.description || 'iDubbl Platform Crypto Deposit',
      cancel_url: `${this.redirectUrl || 'https://idubbl-frontend.onrender.com'}/transactions?payment=cancelled`,
      success_url: `${this.redirectUrl || 'https://idubbl-frontend.onrender.com'}/transactions?payment=success&ref=${data.orderId}`,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();

      if (response.ok && resData.id) {
        return {
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
          status: 'pending',
          paymentUrl: resData.invoice_url,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'NOWPayments invoice creation failed');
      }
    } catch (error) {
      console.error('NOWPayments createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(paymentId) {
    const endpoint = `${this.baseUrl}/payment/${paymentId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const resData = await response.json();

      if (response.ok) {
        return {
          orderId: resData.order_id,
          status: resData.payment_status === 'finished' ? 'success' : 'pending',
          transactionId: resData.payment_id.toString(),
          amount: resData.price_amount,
          currency: resData.price_currency,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'NOWPayments transaction fetch failed');
      }
    } catch (error) {
      console.error('NOWPayments verifyPayment error:', error);
      throw error;
    }
  }

  async handleWebhook(req) {
    const body = req.body;
    // NOWPayments webhook body contains fields directly
    return {
      orderId: body.order_id,
      status: body.payment_status === 'finished' ? 'success' : 'failed',
      eventType: 'payment.finished',
      rawResponse: body,
    };
  }
}
