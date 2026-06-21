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
