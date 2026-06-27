import express from 'express';
import { paymentService } from '../services/index.js';
import { getDb } from '../services/db.js';
import { errorRegistry } from '../services/errorRegistry.js';

const router = express.Router();

// Route to create a payment session/order
router.post('/create', async (req, res) => {
  const { amount, currency, customer, description } = req.body;
  const orderId = `ord_${Date.now()}`;

  if (!amount || !customer || !customer.email) {
    return errorRegistry.send(res, 'INVALID_AMOUNT', 'Amount and customer email are required to create a payment session.');
  }

  try {
    const result = await paymentService.createOrder({
      orderId,
      amount,
      currency,
      customer,
      description,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Payment creation failed:', error);
    return errorRegistry.send(res, 'SERVICE_ERROR', error.message || 'Payment initiation failed.');
  }
});

// Route to verify a transaction status
router.get('/verify/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await paymentService.verifyPayment(transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return errorRegistry.send(res, 'SERVICE_ERROR', error.message || 'Payment verification failed.');
  }
});

// Generic Webhook Callback handler (e.g. Juspay)
router.post('/webhook', async (req, res) => {
  try {
    const event = await paymentService.handleWebhook(req);
    console.log('Webhook Event Processed:', event);
    res.status(200).json({ success: true, received: true, event });
  } catch (error) {
    console.error('Webhook error:', error);
    return errorRegistry.send(res, 'SERVICE_ERROR', error.message || 'Webhook processing failed.');
  }
});

// Callback redirect route for Juspay
router.get('/callback/juspay', async (req, res) => {
  const { order_id, status } = req.query;
  console.log(`Juspay callback: OrderID=${order_id}, Status=${status}`);
  
  try {
    const verification = await paymentService.verifyPayment(order_id);
    return res.send(`Payment status: ${verification.status}. Reference: ${verification.orderId}`);
  } catch (err) {
    return res.status(500).send(`Payment verification failed: ${err.message}`);
  }
});

export default router;
