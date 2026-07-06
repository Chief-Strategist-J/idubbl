import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { client as sharedClient, db as sharedDb } from '../../db.js';
import { toNodeHandler } from 'better-auth/node';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { AuthDriver } from '../ports/AuthDriver.js';
import { sendEmail } from '../../emailService.js';
import { bearer, genericOAuth } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';

export class BetterAuthDriver extends AuthDriver {
  constructor(config) {
    super(config);
    
    try {
      this.client = sharedClient;
      this.db = sharedDb;

      let betterAuthUrl = process.env.BETTER_AUTH_URL || config.baseURL;
      if (!betterAuthUrl) {
        betterAuthUrl = process.env.NODE_ENV === 'production' 
          ? 'https://idubbl-backend.onrender.com/api/auth' 
          : 'http://localhost:5000/api/auth';
      }
      if (betterAuthUrl && !betterAuthUrl.includes('/api/auth')) {
        betterAuthUrl = `${betterAuthUrl.replace(/\/$/, '')}/api/auth`;
      }

      const isProd = betterAuthUrl.startsWith('https://');

      const authOptions = {
        secret: process.env.BETTER_AUTH_SECRET || config.secret || 'SUPER_SECRET_BETTER_AUTH_KEY_CHANGE_ME',
        database: mongodbAdapter(this.db, {
          client: this.client,
        }),
        account: {
          storeStateStrategy: "database",
        },
        hooks: {
          after: createAuthMiddleware(async (ctx) => {
            if (ctx.path.startsWith('/callback/')) {
              const user = ctx.context.user || ctx.context.newSession?.user || ctx.context.session?.user;
              if (user) {
                const token = ctx.context.newSession?.session?.token || ctx.context.session?.token || (await this.db.collection('session').findOne({ userId: user.id }, { sort: { createdAt: -1 } }))?.token;
                if (token) {
                  let callbackURL = ctx.query?.callbackURL || '/dashboard';
                  let fullURL;
                  if (callbackURL.startsWith('http://') || callbackURL.startsWith('https://')) {
                    fullURL = new URL(callbackURL);
                  } else {
                    const origin = ctx.headers.origin || (ctx.headers.host ? `${ctx.headers['x-forwarded-proto'] || 'https'}://${ctx.headers.host}` : 'https://idubbl.com.ng');
                    fullURL = new URL(callbackURL, origin);
                  }
                  fullURL.searchParams.set('token', token);
                  throw ctx.redirect(fullURL.toString());
                }
              }
            }
          })
        },
        advanced: {
          cookie: {
            sameSite: isProd ? "none" : "lax",
            secure: isProd
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
          passkey(),
          ...(process.env.SSO_CLIENT_ID ? [
            genericOAuth({
              config: [
                {
                  providerId: process.env.SSO_PROVIDER_ID || 'sso',
                  clientId: process.env.SSO_CLIENT_ID,
                  clientSecret: process.env.SSO_CLIENT_SECRET || '',
                  discoveryUrl: process.env.SSO_DISCOVERY_URL,
                  authorizationEndpoint: process.env.SSO_AUTHORIZATION_ENDPOINT,
                  tokenEndpoint: process.env.SSO_TOKEN_ENDPOINT,
                  userInfoEndpoint: process.env.SSO_USER_INFO_ENDPOINT,
                }
              ]
            })
          ] : []),
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
                  },
                  showFullAddresses: {
                    type: 'boolean',
                    required: false,
                    defaultValue: false
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
        baseURL: betterAuthUrl,
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
          requireEmailVerification: true,
          sendVerificationEmail: async ({ user, url, token }) => {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            const db = this.db;
            await db.collection('otps').updateOne(
              { email: user.email.toLowerCase() },
              {
                $set: {
                  otp,
                  token,
                  expiresAt: new Date(Date.now() + 15 * 60 * 1000)
                }
              },
              { upsert: true }
            );

            console.log('--------------------------------------------------');
            console.log(`[SIGNUP VERIFICATION OTP] For user: ${user.email}`);
            console.log(`[SIGNUP VERIFICATION OTP] OTP: ${otp}`);
            console.log(`[SIGNUP VERIFICATION OTP] Token: ${token}`);
            console.log('--------------------------------------------------');

            await sendEmail({
              to: user.email,
              subject: `iDubbl Verification Code: ${otp}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; background-color: #f9f9f9;">
                  <h2 style="color: #6366f1; text-align: center;">Verify Your Account</h2>
                  <p style="color: #333; line-height: 1.5; font-size: 1rem;">Welcome to iDubbl! Use the following verification code to activate your account:</p>
                  <div style="text-align: center; margin: 25px 0;">
                    <span style="font-family: monospace; font-size: 2.5rem; font-weight: bold; letter-spacing: 0.25em; color: #6366f1; background-color: #eee; padding: 10px 20px; border-radius: 5px;">${otp}</span>
                  </div>
                  <p style="color: #666; font-size: 0.9em; text-align: center;">This code is valid for 15 minutes.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="color: #999; font-size: 0.8em; line-height: 1.5; text-align: center;">If you did not sign up for an iDubbl account, you can safely ignore this email.</p>
                </div>
              `
            });
          },
          autoSignIn: false,
          resetPasswordTokenExpiresIn: 3600, // 1 hour
          sendResetPassword: async ({ user, url, token }) => {
            const tempPassword = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
            
            // Programmatically update the user's password to this temporary one
            await this.auth.api.resetPassword({
              body: {
                newPassword: tempPassword,
                token: token
              }
            });

            console.log('--------------------------------------------------');
            console.log(`[PASSWORD RESET TEMP PASS] For user: ${user.email}`);
            console.log(`[PASSWORD RESET TEMP PASS] Temporary Password: ${tempPassword}`);
            console.log('--------------------------------------------------');

            await sendEmail({
              to: user.email,
              subject: 'Your iDubbl Temporary Password',
              html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; background-color: #f9f9f9;">
                  <h2 style="color: #6366f1; text-align: center;">Temporary Password</h2>
                  <p style="color: #333; line-height: 1.5; font-size: 1rem;">We received a request to reset your password for your iDubbl account.</p>
                  <p style="color: #333; line-height: 1.5; font-size: 1rem;">Your temporary password is:</p>
                  <div style="text-align: center; margin: 25px 0;">
                    <span style="font-family: monospace; font-size: 1.8rem; font-weight: bold; letter-spacing: 0.1em; color: #6366f1; background-color: #eee; padding: 10px 20px; border-radius: 5px;">${tempPassword}</span>
                  </div>
                  <p style="color: #666; font-size: 0.9em; text-align: center;">Please use this temporary password to log in. We recommend changing it in your Profile settings after you log in.</p>
                </div>
              `
            });
          }
        },
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          },
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
