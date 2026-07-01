import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { authService } from '../services/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedAdmin() {
  console.log('Seeding admin user...');
  try {
    // 1. Sign up the user via Better Auth
    const res = await authService.auth.api.signUpEmail({
      body: {
        email: 'dev.jaydeep919@gmail.com',
        password: 'Scaibu@123',
        name: 'Admin'
      }
    });
    console.log('User signed up successfully.');
    
    // 2. Promote to admin directly in database
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    const usersCol = db.collection('user');
    const result = await usersCol.updateOne(
      { email: 'dev.jaydeep919@gmail.com' },
      { $set: { role: 'admin' } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ User promoted to admin successfully!');
    } else {
      console.warn('⚠️ User matching email not found in DB during promotion update.');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  }
  process.exit(0);
}

seedAdmin();
