import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';
import { toNodeHandler } from 'better-auth/node';
import { AuthDriver } from './AuthDriver.js';

export class BetterAuthDriver extends AuthDriver {
  constructor(config) {
    super(config);
    
    const dbConfig = config.database || { provider: 'mongodb', url: 'mongodb://localhost:27017/idubbl' };
    
    try {
      // Connect to MongoDB
      this.client = new MongoClient(dbConfig.url);
      
      // Initialize connection in background
      this.client.connect()
        .then(() => console.log('MongoDB Client Connected for BetterAuth'))
        .catch(err => console.error('MongoDB connection error in BetterAuth:', err));
        
      this.db = this.client.db();

      const authOptions = {
        secret: config.secret || 'SUPER_SECRET_BETTER_AUTH_KEY_CHANGE_ME',
        database: mongodbAdapter(this.db, {
          client: this.client,
        }),
        emailAndPassword: {
          enabled: config.options?.emailAndPassword?.enabled !== false,
          sendResetPassword: async ({ user, url, token }) => {
            console.log('--------------------------------------------------');
            console.log(`[PASSWORD RESET] For user: ${user.email}`);
            console.log(`[PASSWORD RESET] Token: ${token}`);
            console.log(`[PASSWORD RESET] Link: ${url}`);
            console.log('--------------------------------------------------');

            const resendKey = process.env.RESEND_API_KEY;
            if (resendKey) {
              try {
                const response = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    from: 'iDubbl <onboarding@resend.dev>',
                    to: user.email,
                    subject: 'Reset your iDubbl Password',
                    html: `
                      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px;">
                        <h2 style="color: #1a1a1a; font-family: sans-serif;">Reset your Password</h2>
                        <p style="color: #666; line-height: 1.5; font-family: sans-serif;">We received a request to reset your password for your iDubbl account. Click the button below to reset it:</p>
                        <div style="margin: 25px 0;">
                          <a href="${url}" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-family: sans-serif;">Reset Password</a>
                        </div>
                        <p style="color: #999; font-size: 0.8em; line-height: 1.5; font-family: sans-serif;">If you did not request a password reset, you can safely ignore this email.</p>
                      </div>
                    `
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  console.error('Failed to send email via Resend:', errorData);
                } else {
                  console.log(`Successfully sent reset password email to ${user.email} via Resend.`);
                }
              } catch (emailError) {
                console.error('Error sending reset email with Resend:', emailError);
              }
            }
          }
        },
      };

      this.auth = betterAuth(authOptions);
      this.handler = toNodeHandler(this.auth);
    } catch (error) {
      console.error('Failed to initialize BetterAuth with MongoDB:', error);
      throw error;
    }
  }

  // Delegate HTTP requests directly to better-auth
  handleRequest(req, res) {
    return this.handler(req, res);
  }

  // Get session status from request
  async getSession(req) {
    try {
      const session = await this.auth.api.getSession({
        headers: req.headers,
      });
      return session;
    } catch (error) {
      console.error('Error fetching session via BetterAuth:', error);
      return null;
    }
  }
}
