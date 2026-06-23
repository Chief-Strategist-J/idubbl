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

// Generic Webhook Callback handler (e.g. Flutterwave/Juspay)
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

// Callback redirect route for Flutterwave
router.get('/callback/flutterwave', async (req, res) => {
  const { transaction_id, status, tx_ref } = req.query;
  console.log(`Flutterwave callback: ID=${transaction_id}, Status=${status}, Ref=${tx_ref}`);
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://idubbl-frontend.onrender.com';

  if (status === 'successful' || status === 'completed') {
    try {
      const verification = await paymentService.verifyPayment(transaction_id);
      
      const db = await getDb();
      // Find the user by their email (case-insensitive)
      const userEmail = verification.rawResponse?.data?.customer?.email;
      if (userEmail) {
        const user = await db.collection('user').findOne({ 
          email: { $regex: new RegExp(`^${userEmail.trim()}$`, 'i') } 
        });
        if (user) {
          const userId = user.id || user._id.toString();
          
          // Credit the wallet
          await db.collection('wallets').updateOne(
            { userId: userId },
            { 
              $inc: { availableBalance: Number(verification.amount) },
              $setOnInsert: { lockedBalance: 0, pendingWithdrawals: 0, createdAt: new Date() }
            },
            { upsert: true }
          );

          // Log the transaction
          await db.collection('transactions').insertOne({
            userId: userId,
            amount: Number(verification.amount),
            status: 'approved',
            type: 'deposit',
            method: 'flutterwave',
            txHash: transaction_id,
            note: `Flutterwave Deposit Ref: ${verification.orderId}`,
            createdAt: new Date(),
          });
        } else {
          console.warn(`User with email "${userEmail}" not found in database for callback.`);
        }
      }

      return res.redirect(`${frontendUrl}/transactions?payment=success&ref=${verification.orderId}`);
    } catch (err) {
      console.error('Callback processing failed:', err);
      return res.redirect(`${frontendUrl}/transactions?payment=failed&error=${encodeURIComponent(err.message)}`);
    }
  }
  return res.redirect(`${frontendUrl}/transactions?payment=failed&status=${status}`);
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
