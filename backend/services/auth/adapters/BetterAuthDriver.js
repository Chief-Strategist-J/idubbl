import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { client as sharedClient, db as sharedDb } from '../../db.js';
import { toNodeHandler } from 'better-auth/node';
import { APIError } from 'better-auth/api';
import { AuthDriver } from '../ports/AuthDriver.js';
import { sendEmail } from '../../emailService.js';
import { bearer } from 'better-auth/plugins';

export class BetterAuthDriver extends AuthDriver {
  constructor(config) {
    super(config);
    
    try {
      this.client = sharedClient;
      this.db = sharedDb;

      const authOptions = {
        secret: process.env.BETTER_AUTH_SECRET || config.secret || 'SUPER_SECRET_BETTER_AUTH_KEY_CHANGE_ME',
        database: mongodbAdapter(this.db, {
          client: this.client,
        }),
        advanced: {
          cookie: {
            sameSite: (process.env.NODE_ENV === 'production' || (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL.startsWith('https://'))) ? "none" : "lax",
            secure: process.env.NODE_ENV === 'production' || (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL.startsWith('https://'))
          }
        },
        session: {
          expiresIn:        60 * 60 * 24 * 30,  // 30 days
          updateAge:        60 * 60 * 24,        // extend cookie once per day if active
          cookieCache: {
            enabled: true,
            maxAge:  5 * 60                      // 5-min server-side cache → fewer DB hits
          }
        },
        databaseHooks: {
          user: {
            create: {
              before: async (user) => {
                if (user.role === 'admin') {
                  user.role = 'player';
                }
                
                // Generate a unique 8-character referral code
                let referralCode = '';
                let exists = true;
                while (exists) {
                  referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                  const found = await this.db.collection('user').findOne({ referralCode });
                  if (!found) {
                    exists = false;
                  }
                }
                user.referralCode = referralCode;

                // Link referredBy if enteredReferralCode matches a valid code
                if (user.enteredReferralCode) {
                  const parentUser = await this.db.collection('user').findOne({
                    referralCode: user.enteredReferralCode.trim().toUpperCase()
                  });
                  if (parentUser) {
                    user.referredBy = parentUser.referralCode;
                  }
                }

                return {
                  data: user
                };
              }
            }
          }
        },
        plugins: [
          bearer(),
          {
            id: 'admin-roles',
            schema: {
              user: {
                fields: {
                  role: {
                    type: 'string',
                    required: false,
                    defaultValue: 'player'
                  },
                  referralCode: {
                    type: 'string',
                    required: false
                  },
                  referredBy: {
                    type: 'string',
                    required: false
                  },
                  enteredReferralCode: {
                    type: 'string',
                    required: false
                  }
                }
              }
            }
          },
          {
            id: 'portal-restriction',
            hooks: {
              before: [
                {
                  matcher: (ctx) => ctx.path.startsWith('/sign-in/email'),
                  handler: async (ctx) => {
                    const email = ctx.body?.email;
                    if (!email) return;
                    
                    const user = await this.db.collection('user').findOne({ email: new RegExp(`^${email}$`, 'i') });
                    const portal = ctx.headers ? (typeof ctx.headers.get === 'function' ? ctx.headers.get('x-portal') : ctx.headers['x-portal'] || ctx.headers['x-portal'.toLowerCase()]) : null;
                    
                    if (user) {
                      if (user.role !== 'admin') {
                        if (portal === 'admin') {
                          throw new APIError("BAD_REQUEST", {
                            message: "Access denied. Only administrators can log in here."
                          });
                        }
                      }
                    }
                  }
                },
                {
                  matcher: (ctx) => ctx.path.startsWith('/sign-up/email'),
                  handler: async (ctx) => {
                    if (ctx.body && (ctx.body.role === 'admin' || ctx.body.role === 'administrator')) {
                      throw new APIError("BAD_REQUEST", {
                        message: "Admin accounts cannot be created."
                      });
                    }
                    if (ctx.body) {
                      ctx.body.role = 'player';
                    }
                  }
                }
              ]
            }
          }
        ],
        baseURL: process.env.BETTER_AUTH_URL || (process.env.NODE_ENV === 'production' ? 'https://idubbl-backend.onrender.com' : 'http://localhost:5000'),
        trustedOrigins: [
          'https://idubbl-frontend.onrender.com',
          'https://idubbl.com.ng',
          'http://idubbl.com.ng',
          'https://www.idubbl.com.ng',
          'http://www.idubbl.com.ng',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:3000'
        ],
        emailAndPassword: {
          enabled: config.options?.emailAndPassword?.enabled !== false,
          sendResetPassword: async ({ user, url, token }) => {
            console.log('--------------------------------------------------');
            console.log(`[PASSWORD RESET] For user: ${user.email}`);
            console.log(`[PASSWORD RESET] Token: ${token}`);
            console.log(`[PASSWORD RESET] Link: ${url}`);
            console.log('--------------------------------------------------');

            await sendEmail({
              to: user.email,
              subject: 'Reset your iDubbl Password',
              html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 5px;">
                  <h2 style="color: #1a1a1a; font-family: sans-serif;">Reset your Password</h2>
                  <p style="color: #666; line-height: 1.5; font-family: sans-serif;">We received a request to reset your password for your iDubbl account. Click the button below to reset it:</p>
                  <div style="margin: 25px 0;">
                    <a href="${url}" style="background-color: #00f5a0; color: #04130d; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-family: sans-serif;">Reset Password</a>
                  </div>
                  <p style="color: #999; font-size: 0.8em; line-height: 1.5; font-family: sans-serif;">If you did not request a password reset, you can safely ignore this email.</p>
                </div>
              `
            });
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
