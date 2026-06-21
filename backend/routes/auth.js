import express from 'express';
import { authService } from '../services/index.js';

const router = express.Router();

// Forward all /api/auth requests to the active auth driver handler
router.use(async (req, res, next) => {
  try {
    await authService.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling auth request:', error);
    res.status(500).json({ 
      error: 'Authentication service error',
      message: error.message,
      stack: error.stack
    });
  }
});

export default router;
