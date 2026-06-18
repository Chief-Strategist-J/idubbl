import test from 'node:test';
import assert from 'node:assert';
import { authRegistry } from '../services/auth/AuthRegistry.js';
import { AuthDriver } from '../services/auth/AuthDriver.js';
import { paymentRegistry } from '../services/payment/PaymentRegistry.js';
import { PaymentDriver } from '../services/payment/PaymentDriver.js';

// Define mock drivers for testing registry logic without external database dependencies
class MockAuthDriver extends AuthDriver {
  handleRequest(req, res) {
    return 'auth-handled';
  }
  async getSession(req) {
    return { user: 'test-user' };
  }
}

class MockPaymentDriver extends PaymentDriver {
  async createOrder(data) {
    return { orderId: data.orderId, status: 'initiated', paymentUrl: 'https://mock-payment.com' };
  }
  async verifyPayment(id) {
    return { orderId: id, status: 'success' };
  }
}

test('AuthRegistry - Driver Registration and Initialization', (t) => {
  // Register mock driver
  authRegistry.register('mock-auth', MockAuthDriver);

  // Assert registered driver can be initialized
  const initialized = authRegistry.initialize('mock-auth', { secret: 'test-secret' });
  assert.ok(initialized instanceof MockAuthDriver);

  // Assert retrieval works
  const retrieved = authRegistry.getActive();
  assert.strictEqual(retrieved, initialized);
  assert.strictEqual(retrieved.handleRequest(), 'auth-handled');
});

test('PaymentRegistry - Driver Registration and Initialization', (t) => {
  // Register mock driver
  paymentRegistry.register('mock-pay', MockPaymentDriver);

  // Assert registered driver can be initialized
  const initialized = paymentRegistry.initialize('mock-pay', { apiKey: 'test-key' });
  assert.ok(initialized instanceof MockPaymentDriver);

  // Assert retrieval works
  const retrieved = paymentRegistry.getActive();
  assert.strictEqual(retrieved, initialized);
});
