export class PaymentDriver {
  constructor(config) {
    this.config = config;
  }

  /**
   * Create a payment order/transaction
   * @param {Object} data
   * @param {string} data.orderId - Unique order ID
   * @param {number} data.amount - Order amount
   * @param {string} data.currency - Order currency (e.g. USD, INR)
   * @param {Object} data.customer - Customer info: { name, email, phone }
   * @param {string} [data.description] - Description of payment
   * @returns {Promise<Object>} Unified response format
   */
  async createOrder(data) {
    throw new Error("method createOrder() must be implemented");
  }

  /**
   * Verify the status of a payment/transaction
   * @param {string} transactionId - The transaction reference or ID
   * @returns {Promise<Object>} Unified response format
   */
  async verifyPayment(transactionId) {
    throw new Error("method verifyPayment() must be implemented");
  }

  /**
   * Parse and verify a webhook event from the gateway
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} Unified webhook event format
   */
  async handleWebhook(req) {
    throw new Error("method handleWebhook() must be implemented");
  }
}
