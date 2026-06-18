import express from 'express';
import { paymentService } from '../services/index.js';

const router = express.Router();

// Route to create a payment session/order
router.post('/create', async (req, res) => {
  const { amount, currency, customer, description } = req.body;
  const orderId = `ord_${Date.now()}`;

  if (!amount || !customer || !customer.email) {
    return res.status(400).json({ error: 'Missing required parameters: amount, customer.email' });
  }

  try {
    const result = await paymentService.createOrder({
      orderId,
      amount,
      currency,
      customer,
      description,
    });
    res.json(result);
  } catch (error) {
    console.error('Payment creation failed:', error);
    res.status(500).json({ error: error.message || 'Payment initiation failed' });
  }
});

// Route to verify a transaction status
router.get('/verify/:transactionId', async (req, res) => {
  const { transactionId } = req.params;

  try {
    const result = await paymentService.verifyPayment(transactionId);
    res.json(result);
  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

// Generic Webhook Callback handler (e.g. Flutterwave/Juspay)
router.post('/webhook', async (req, res) => {
  try {
    const event = await paymentService.handleWebhook(req);
    console.log('Webhook Event Processed:', event);
    // Add logic here to update order status in DB
    res.status(200).json({ received: true, event });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Callback redirect route for Flutterwave
router.get('/callback/flutterwave', async (req, res) => {
  const { transaction_id, status, tx_ref } = req.query;
  console.log(`Flutterwave callback: ID=${transaction_id}, Status=${status}, Ref=${tx_ref}`);
  
  if (status === 'successful' || status === 'completed') {
    try {
      const verification = await paymentService.verifyPayment(transaction_id);
      return res.send(`Payment Success! Reference: ${verification.orderId}`);
    } catch (err) {
      return res.status(500).send(`Payment verified failed: ${err.message}`);
    }
  }
  res.send(`Payment incomplete. Status: ${status}`);
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
