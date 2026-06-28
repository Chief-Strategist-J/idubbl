import express from 'express';
import { matchmakerService } from '../services/matchmakerService.js';
import { errorRegistry } from '../services/errorRegistry.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/invite', async (req, res) => {
  const { friendEmail, senderName } = req.body;
  if (!friendEmail) {
    return res.status(400).json({ success: false, error: 'Recipient email is required.' });
  }

  const name = senderName || 'A friend';
  const inviteLink = 'https://idubbl-frontend.onrender.com/';

  const emailHtml = `
    <div style="font-family: sans-serif; background-color: #0A0D12; padding: 40px; color: #F5F7FA; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #232938;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #00E37A; font-family: sans-serif; font-size: 2.2rem; font-weight: 800; margin: 0 0 10px 0;">iDubbl</h1>
        <p style="color: #9AA4B2; font-size: 1.1rem; margin: 0;">Skill decides the winner, not chance.</p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <p style="font-size: 1.1rem; line-height: 1.6; color: #F5F7FA;">
          Hello! <strong>${name}</strong> has invited you to face off in live skill matches on iDubbl.
        </p>
        <p style="font-size: 0.95rem; line-height: 1.6; color: #9AA4B2; margin-top: 10px;">
          Choose a tier, join the lobby, duel in games like Word Duel or Math Duel, and take the prize pool!
        </p>
      </div>

      <div style="margin: 30px 0; text-align: center;">
        <a href="${inviteLink}" style="background-color: #00E37A; color: #0A0D12; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-family: sans-serif; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 227, 122, 0.3);">
          Accept Invitation & Play
        </a>
      </div>

      <div style="text-align: center; color: #5B6472; font-size: 0.8rem; border-top: 1px solid #232938; padding-top: 20px; margin-top: 30px;">
        <p style="margin: 0 0 5px 0;">USDT deposits and instant TRC-20 payouts supported.</p>
        <p style="margin: 0;">&copy; 2026 iDubbl Inc. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: friendEmail,
      subject: `${name} invited you to play and win on iDubbl!`,
      html: emailHtml
    });
    res.json({ success: true, message: 'Invitation email successfully sent!' });
  } catch (error) {
    console.error('Invite email error:', error);
    res.status(500).json({ success: false, error: 'Failed to send invite email.' });
  }
});

router.post('/find', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  const { tier } = req.body;

  if (!userId) {
    return errorRegistry.send(res, 'UNAUTHORIZED', 'User ID is required.');
  }
  if (!tier) {
    return res.status(400).json({ success: false, error: 'Tier is required.' });
  }

  try {
    const result = await matchmakerService.findMatch(userId, tier);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Matchmaking error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;

  if (!userId) {
    return errorRegistry.send(res, 'UNAUTHORIZED', 'User ID is required.');
  }

  try {
    const result = await matchmakerService.cancelMatchmaking(userId);
    res.json(result);
  } catch (error) {
    console.error('Matchmaking cancel error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
