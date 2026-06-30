import express from 'express';
import fetch from 'node-fetch'; // If node-fetch isn't available, we can use global fetch in Node 18+ or standard import
import { getDb } from '../services/db.js';
import { errorRegistry } from '../services/errorRegistry.js';
import { authService } from '../services/index.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Helper to retrieve userId from session or headers
async function getUserIdFromReq(req) {
  try {
    const userIdHeader = req.headers['x-user-id'];
    if (userIdHeader) return userIdHeader;

    const sessionData = await authService.getSession(req);
    if (sessionData && sessionData.user) {
      return sessionData.user.id || sessionData.user._id?.toString();
    }
  } catch (error) {
    console.error('Error fetching userId in KYC route:', error);
  }
  return null;
}

// 1. Get current user's KYC status
router.get('/status', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    if (!userId) {
      return errorRegistry.send(res, 'UNAUTHORIZED', 'Authentication required.');
    }

    const db = await getDb();
    let dbUser = await db.collection('user').findOne({ id: userId });
    if (!dbUser && userId.length === 24) {
      try {
        dbUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      } catch (err) {}
    }

    if (!dbUser) {
      return errorRegistry.send(res, 'USER_NOT_FOUND', 'User profile not found.');
    }

    res.json({
      success: true,
      kycStatus: dbUser.kycStatus || 'unverified',
      kycDetails: dbUser.kycDetails || null
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ success: false, error: 'Internal server error fetching KYC status' });
  }
});

// 2. Mint QoreID session token
router.post('/session', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    if (!userId) {
      return errorRegistry.send(res, 'UNAUTHORIZED', 'Authentication required.');
    }

    const db = await getDb();
    let dbUser = await db.collection('user').findOne({ id: userId });
    if (!dbUser && userId.length === 24) {
      try {
        dbUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      } catch (err) {}
    }

    if (!dbUser) {
      return errorRegistry.send(res, 'USER_NOT_FOUND', 'User profile not found.');
    }

    const clientId = process.env.QOREID_CLIENT_ID;
    const secret = process.env.QOREID_SECRET;
    const workflowId = process.env.QOREID_WORKFLOW_ID;

    // Split name into first and last
    const nameParts = (dbUser.name || 'User').split(' ');
    const firstname = nameParts[0] || 'User';
    const lastname = nameParts.slice(1).join(' ') || 'Player';

    // If QoreID credentials are not configured, return simulation flag
    if (!clientId || !secret) {
      console.log('QoreID credentials not configured. Returning simulation details.');
      return res.json({
        success: true,
        simulation: true,
        sessionId: `sim_sess_${Date.now()}`,
        sdkSessionToken: `sim_token_${Date.now()}`,
        type: 'collection',
        productCode: 'liveness'
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${clientId}:${secret}`).toString('base64');
    
    // Call QoreID /v1/sessions
    // Depending on config, we can run a workflow session or a collection session
    const payload = workflowId 
      ? {
          type: 'workflow',
          workflowId: Number(workflowId),
          reference: `idubbl-kyc-${userId}-${Date.now()}`
        }
      : {
          productCode: 'liveness',
          reference: `idubbl-kyc-${userId}-${Date.now()}`,
          subjectRef: `user-${userId}`
        };

    const qoreRes = await fetch('https://api.qoreid.com/v1/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    if (!qoreRes.ok) {
      const errorText = await qoreRes.text();
      console.error('QoreID session mint failed:', errorText);
      return res.status(400).json({ success: false, error: 'Failed to mint QoreID session token from QoreID API' });
    }

    const qoreData = await qoreRes.json();
    
    // Set status to pending in DB
    await db.collection('user').updateOne(
      { _id: dbUser._id },
      { $set: { kycStatus: 'pending' } }
    );

    res.status(201).json({
      success: true,
      simulation: false,
      sessionId: qoreData.sessionId,
      sdkSessionToken: qoreData.sdkSessionToken,
      type: qoreData.type,
      productCode: qoreData.productCode,
      workflowId: qoreData.workflowId
    });
  } catch (error) {
    console.error('Error in QoreID session mint:', error);
    res.status(500).json({ success: false, error: 'Internal server error minting session token' });
  }
});

// 3. QoreID Webhook / Callback endpoint
router.post('/callback', async (req, res) => {
  try {
    const data = req.body;
    console.log('Received QoreID webhook callback:', JSON.stringify(data));

    // Extract reference and status
    // Usually reference contains our user ID: `idubbl-kyc-${userId}-${timestamp}`
    const reference = data.reference || (data.summary && data.summary.reference);
    if (!reference) {
      return res.status(400).json({ success: false, error: 'Missing reference in callback' });
    }

    const matches = reference.match(/idubbl-kyc-([a-zA-Z0-9_-]+)-\d+/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid reference format' });
    }

    const userId = matches[1];
    const db = await getDb();
    
    let dbUser = await db.collection('user').findOne({ id: userId });
    if (!dbUser && userId.length === 24) {
      try {
        dbUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      } catch (err) {}
    }

    if (!dbUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Determine status: "verified" or "failed"
    // Typically, QoreID sends 'status' or verification summary status
    const verificationStatus = data.status || (data.summary && data.summary.status);
    const isSuccess = ['success', 'verified', 'approved', 'pass'].includes(String(verificationStatus).toLowerCase());

    const newKycStatus = isSuccess ? 'verified' : 'failed';

    await db.collection('user').updateOne(
      { _id: dbUser._id },
      { 
        $set: { 
          kycStatus: newKycStatus,
          kycDetails: {
            callbackData: data,
            updatedAt: new Date()
          }
        } 
      }
    );

    res.json({ success: true, message: `KYC status updated to ${newKycStatus}` });
  } catch (error) {
    console.error('Error in QoreID webhook callback:', error);
    res.status(500).json({ success: false, error: 'Internal server error in callback' });
  }
});

// 4. Simulate KYC endpoint (for easy testing/demo)
router.post('/simulate', async (req, res) => {
  try {
    const userId = await getUserIdFromReq(req);
    if (!userId) {
      return errorRegistry.send(res, 'UNAUTHORIZED', 'Authentication required.');
    }

    const { status } = req.body;
    if (!['unverified', 'pending', 'verified', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const db = await getDb();
    let dbUser = await db.collection('user').findOne({ id: userId });
    if (!dbUser && userId.length === 24) {
      try {
        dbUser = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      } catch (err) {}
    }

    if (!dbUser) {
      return errorRegistry.send(res, 'USER_NOT_FOUND', 'User profile not found.');
    }

    await db.collection('user').updateOne(
      { _id: dbUser._id },
      { 
        $set: { 
          kycStatus: status,
          kycDetails: {
            simulated: true,
            updatedAt: new Date()
          }
        } 
      }
    );

    res.json({ success: true, kycStatus: status });
  } catch (error) {
    console.error('Error simulating KYC status:', error);
    res.status(500).json({ success: false, error: 'Internal server error in simulation' });
  }
});

export default router;
