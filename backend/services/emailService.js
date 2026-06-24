export async function sendEmail({ to, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log(`[EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
    return;
  }
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'iDubbl <onboarding@resend.dev>',
        to: to,
        subject: subject,
        html: html
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to send email via Resend:', errorData);
    } else {
      console.log(`Email successfully sent to ${to} via Resend.`);
    }
  } catch (err) {
    console.error('Error dispatching email via Resend:', err);
  }
}
