import express from 'express';
import { getDb } from '../services/db.js';
import { authService } from '../services/index.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/support/contact
router.post('/contact', async (req, res) => {
  const { subject, description, refId } = req.body;
  
  if (!subject || !description) {
    return res.status(400).json({ success: false, error: 'Subject and description are required.' });
  }

  try {
    // Attempt to resolve user from session
    let userEmail = 'Anonymous/Unauthenticated';
    let userName = 'Anonymous';
    let userId = null;
    
    const session = await authService.getSession(req);
    if (session && session.user) {
      userEmail = session.user.email;
      userName = session.user.name || 'User';
      userId = session.user.id || session.user._id?.toString();
    }

    const db = await getDb();
    const ticket = {
      userId,
      userEmail,
      userName,
      subject,
      description,
      refId,
      status: 'pending',
      createdAt: new Date()
    };
    const insertRes = await db.collection('support_tickets').insertOne(ticket);
    const ticketId = insertRes.insertedId.toString();

    const htmlContent = `
      <h2>New Support Ticket Received</h2>
      <p><strong>Ticket ID:</strong> <code>${ticketId}</code></p>
      <p><strong>From:</strong> ${userName} (${userEmail})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Description:</strong></p>
      <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #00d28c; margin: 10px 0;">
        ${description.replace(/\n/g, '<br/>')}
      </div>
      ${refId ? `<p><strong>Reference ID:</strong> <code>${refId}</code></p>` : ''}
      <hr/>
      <p style="font-size: 0.8em; color: #999;">iDubbl Platform Automated Notification</p>
    `;

    // Send email to support inbox
    await sendEmail({
      to: 'jasminecook1900@gmail.com',
      subject: `[SUPPORT TICKET] ${subject}`,
      html: htmlContent
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling contact form submission:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch message to support.' });
  }
});

export default router;
