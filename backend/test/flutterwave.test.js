import { test } from 'node:test';
import assert from 'node:assert';
import { paymentRegistry } from '../services/payment/PaymentRegistry.js';
import { FlutterwaveDriver } from '../services/payment/adapters/FlutterwaveDriver.js';

test('FlutterwaveDriver - Registration and Instance initialization', () => {
  // Test registration under registry
  const driverClass = paymentRegistry.drivers.get('flutterwave');
  assert.strictEqual(driverClass, FlutterwaveDriver);

  // Test initialization
  const config = {
    secretKey: 'FLWSECK_test-12345',
    baseUrl: 'https://api.flutterwave.com/v3',
    redirectUrl: 'http://localhost:5000/api/payment/callback/flutterwave'
  };
  
  const driver = new FlutterwaveDriver(config);
  assert.strictEqual(driver.secretKey, 'FLWSECK_test-12345');
  assert.strictEqual(driver.baseUrl, 'https://api.flutterwave.com/v3');
  assert.strictEqual(driver.redirectUrl, 'http://localhost:5000/api/payment/callback/flutterwave');
});

test('FlutterwaveDriver - handleWebhook parsing', async () => {
  const driver = new FlutterwaveDriver({ secretKey: 'key' });
  const mockReq = {
    body: {
      event: 'charge.completed',
      data: {
        tx_ref: 'ord_123',
        status: 'successful',
        id: 98765,
        amount: 25,
        currency: 'USD'
      }
    }
  };

  const parsed = await driver.handleWebhook(mockReq);
  assert.strictEqual(parsed.orderId, 'ord_123');
  assert.strictEqual(parsed.status, 'success');
  assert.strictEqual(parsed.eventType, 'charge.completed');
});
