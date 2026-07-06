import express from 'express';
import { authService } from '../services/index.js';

const router = express.Router();

// Custom direct GET route for initiating social logins (prevents cross-site cookie blocking)
router.get('/social-login', async (req, res) => {
  try {
    const { provider, callbackURL, errorCallbackURL } = req.query;
    if (!provider) {
      return res.status(400).json({ error: 'Provider parameter is required' });
    }

    // Call Better Auth programmatic API to initiate social sign-in
    const authResponse = await authService.auth.api.signInSocial({
      body: {
        provider,
        callbackURL: callbackURL || 'https://idubbl.com.ng/dashboard',
        errorCallbackURL: errorCallbackURL || 'https://idubbl.com.ng/login',
      },
      headers: new Headers(req.headers),
      asResponse: true,
    });

    // Copy cookies and headers from Web Response to Express res
    authResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-encoding' && lowerKey !== 'set-cookie') {
        res.setHeader(key, value);
      }
    });

    // Handle Set-Cookie separately to prevent comma-joining issues
    const setCookies = authResponse.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies);
    }

    if (authResponse.status === 302 || authResponse.status === 307 || authResponse.status === 301) {
      const location = authResponse.headers.get('location');
      return res.redirect(location);
    }

    const text = await authResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // not JSON
    }

    if (data && data.url) {
      return res.redirect(data.url);
    }

    res.status(authResponse.status).send(text);
  } catch (error) {
    console.error('Error initiating social login:', error);
    res.status(500).json({ error: 'Failed to initiate social login' });
  }
});

// POST /api/auth/reset-password-otp
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Email, OTP, and password are required' });
    }

    const db = authService.db;
    const otpRecord = await db.collection('otps').findOne({ email: email.toLowerCase() });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP requested for this email' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Call better-auth programmatic API to reset the password with the associated token
    const authResponse = await authService.auth.api.resetPassword({
      body: {
        newPassword: password,
        token: otpRecord.token
      },
      asResponse: true
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      return res.status(authResponse.status).json({ error: errorData.message || 'Failed to reset password' });
    }

    // Delete the used OTP record
    await db.collection('otps').deleteOne({ email: email.toLowerCase() });

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password with OTP:', error);
    res.status(500).json({ error: 'Internal server error resetting password' });
  }
});

// Forward all /api/auth requests to the active auth driver handler
router.use(async (req, res, next) => {
  try {
    await authService.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling auth request:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

export default router;
