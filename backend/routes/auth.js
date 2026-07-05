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
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

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
