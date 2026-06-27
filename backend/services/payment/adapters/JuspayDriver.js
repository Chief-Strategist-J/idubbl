import fetch from 'node-fetch';
import { PaymentDriver } from '../ports/PaymentDriver.js';

export class JuspayDriver extends PaymentDriver {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
    this.merchantId = config.merchantId;
    this.baseUrl = config.baseUrl || 'https://sandbox.juspay.in';
    this.returnUrl = config.returnUrl;
  }

  // Base64 encoding authorization header for Juspay API
  getAuthHeader() {
    const credentials = `${this.apiKey}:`;
    const encoded = Buffer.from(credentials).toString('base64');
    return `Basic ${encoded}`;
  }

  async createOrder(data) {
    const endpoint = `${this.baseUrl}/orders`;
    const body = {
      order_id: data.orderId,
      amount: data.amount,
      currency: data.currency || 'INR',
      customer_id: data.customer.id || `cust_${Date.now()}`,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone || '',
      return_url: this.returnUrl,
      action: 'paymentPage',
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'x-merchantid': this.merchantId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const resData = await response.json();

      if (response.ok) {
        // Juspay provides checkout URL inside payment_links or options
        const paymentUrl = resData.payment_links?.web || resData.payment_links?.iframe || '';
        return {
          orderId: resData.order_id,
          amount: resData.amount,
          currency: resData.currency,
          status: resData.status ? resData.status.toLowerCase() : 'pending',
          paymentUrl: paymentUrl,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'Juspay order creation failed');
      }
    } catch (error) {
      console.error('Juspay createOrder error:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId) {
    const endpoint = `${this.baseUrl}/orders/${transactionId}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'x-merchantid': this.merchantId,
          'Content-Type': 'application/json',
        },
      });

      const resData = await response.json();

      if (response.ok) {
        // Status can be: CHARGED, AUTHENTICATED, NEW, PENDING_VBV
        const statusMap = {
          'CHARGED': 'success',
          'AUTHENTICATED': 'pending',
          'NEW': 'pending',
          'PENDING_VBV': 'pending',
        };
        const status = statusMap[resData.status] || 'failed';

        return {
          orderId: resData.order_id,
          status: status,
          transactionId: resData.txn_id || transactionId,
          amount: resData.amount,
          currency: resData.currency,
          rawResponse: resData,
        };
      } else {
        throw new Error(resData.message || 'Juspay transaction verification failed');
      }
    } catch (error) {
      console.error('Juspay verifyPayment error:', error);
      throw error;
    }
  }

  async handleWebhook(req) {
    // In Juspay webhooks are sent via POST
    const body = req.body;
    const event = body?.event_name;
    const order = body?.content?.order;

    return {
      orderId: order?.order_id,
      status: order?.status === 'CHARGED' ? 'success' : 'failed',
      eventType: event || 'ORDER_COMPLETED',
      rawResponse: body,
    };
  }
}
