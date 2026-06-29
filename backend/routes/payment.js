import express from 'express';
import { paymentService, authService } from '../services/index.js';
import { getDb } from '../services/db.js';
import { errorRegistry } from '../services/errorRegistry.js';

const router = express.Router();

const IDUBBU_RATE = 1000;

async function getUserIdFromReq(req) {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) return userIdHeader;

    const sessionData = await authService.getSession(req);
    if (sessionData && sessionData.user) {
      return sessionData.user.id || sessionData.user._id?.toString();
    }
  } catch (error) {
    console.error('Error fetching userId from request session:', error);
  }
  return 'u1';
}

// Route to create a payment session/order
router.post('/create', async (req, res) => {
  const { amount, currency, customer, description, gateway } = req.body;
  const orderId = `ord_${Date.now()}`;

  if (!amount || !customer || !customer.email) {
    return errorRegistry.send(res, 'INVALID_AMOUNT', 'Amount and customer email are required to create a payment session.');
  }

  try {
    const userId = await getUserIdFromReq(req);
    const db = await getDb();

    let activeService = paymentService;
    if (gateway) {
      const { paymentRegistry } = await import('../services/payment/PaymentRegistry.js');
      if (paymentRegistry.drivers.has(gateway)) {
        const { config } = await import('../services/index.js');
        const gatewayConfig = config.payments?.gateways?.[gateway] || {};
        activeService = paymentRegistry.initialize(gateway, gatewayConfig);
      }
    }

    const result = await activeService.createOrder({
      orderId,
      amount,
      currency,
      customer,
      description,
    });

    // Save pending transaction in database to track who initiated this deposit
    await db.collection('transactions').insertOne({
      userId,
      amount: Number(amount),
      currency: currency || 'USD',
      refId: orderId, // Flutterwave tx_ref
      status: 'pending',
      type: 'deposit',
      gateway: gateway || 'juspay',
      createdAt: new Date(),
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
  const { gateway } = req.query;

  try {
    let activeService = paymentService;
    if (gateway) {
      const { paymentRegistry } = await import('../services/payment/PaymentRegistry.js');
      if (paymentRegistry.drivers.has(gateway)) {
        const { config } = await import('../services/index.js');
        const gatewayConfig = config.payments?.gateways?.[gateway] || {};
        activeService = paymentRegistry.initialize(gateway, gatewayConfig);
      }
    }
    const result = await activeService.verifyPayment(transactionId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Payment verification failed:', error);
    return errorRegistry.send(res, 'SERVICE_ERROR', error.message || 'Payment verification failed.');
  }
});

// Generic Webhook Callback handler (e.g. Juspay / Flutterwave)
router.post('/webhook', async (req, res) => {
  try {
    const db = await getDb();
    
    // Determine gateway from webhook content or headers
    let gateway = 'juspay';
    const body = req.body;
    if (body?.event && body?.data?.tx_ref) {
      gateway = 'flutterwave';
    }

    const { paymentRegistry } = await import('../services/payment/PaymentRegistry.js');
    const { config } = await import('../services/index.js');
    const gatewayConfig = config.payments?.gateways?.[gateway] || {};
    const activeService = paymentRegistry.initialize(gateway, gatewayConfig);

    const event = await activeService.handleWebhook(req);
    console.log('Webhook Event Processed:', event);

    if (event.status === 'success' && event.orderId) {
      const tx = await db.collection('transactions').findOne({ refId: event.orderId, status: 'pending' });
      if (tx) {
        await db.collection('transactions').updateOne(
          { refId: event.orderId },
          { $set: { status: 'approved', verifiedAt: new Date() } }
        );
        await db.collection('wallets').updateOne(
          { userId: tx.userId },
          { $inc: { depositBalance: tx.amount, idubbuBalance: tx.amount * IDUBBU_RATE } }
        );
      }
    }

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

// Callback redirect route for Flutterwave
router.get('/callback/flutterwave', async (req, res) => {
  const { status, tx_ref, transaction_id } = req.query;
  console.log(`Flutterwave callback: Status=${status}, TxRef=${tx_ref}, TransactionID=${transaction_id}`);
  
  const frontendUrl = process.env.FRONTEND_URL || 'https://idubbl-frontend.onrender.com';

  try {
    const db = await getDb();
    
    // Resolve driver
    const { paymentRegistry } = await import('../services/payment/PaymentRegistry.js');
    const { config } = await import('../services/index.js');
    const gatewayConfig = config.payments?.gateways?.flutterwave || {};
    const activeService = paymentRegistry.initialize('flutterwave', gatewayConfig);

    // Verify using either the transaction ID or the reference
    const verification = await activeService.verifyPayment(transaction_id || tx_ref);
    
    if (verification.status === 'success') {
      // Find the corresponding pending transaction
      const tx = await db.collection('transactions').findOne({ refId: verification.orderId, status: 'pending' });
      if (tx) {
        // Credit the wallet
        await db.collection('transactions').updateOne(
          { refId: verification.orderId },
          { $set: { status: 'approved', verifiedAt: new Date() } }
        );
        await db.collection('wallets').updateOne(
          { userId: tx.userId },
          { $inc: { depositBalance: tx.amount, idubbuBalance: tx.amount * IDUBBU_RATE } }
        );
      }
      
      // Redirect back to frontend
      return res.redirect(`${frontendUrl}/wallet?payment=success&ref=${verification.orderId}`);
    } else {
      return res.redirect(`${frontendUrl}/wallet?payment=failed&ref=${verification.orderId || tx_ref}`);
    }
  } catch (err) {
    console.error('Flutterwave redirect processing failed:', err);
    return res.redirect(`${frontendUrl}/wallet?payment=error&message=${encodeURIComponent(err.message)}`);
  }
});

export default router;
