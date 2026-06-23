import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from parent directory if applicable
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not set in environment or .env file');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // --- 1. Migrate Wallet Schema to split Deposit vs Winnings ---
    console.log('Migrating wallets schema...');
    const walletsCol = db.collection('wallets');
    const wallets = await walletsCol.find({}).toArray();
    
    let walletsMigrated = 0;
    for (const wallet of wallets) {
      const updateFields = {};
      
      // If the wallet does not have depositBalance, migrate availableBalance to it
      if (wallet.depositBalance === undefined) {
        updateFields.depositBalance = wallet.availableBalance !== undefined ? wallet.availableBalance : 0;
      }
      
      // If the wallet does not have winningsBalance, initialize it to 0
      if (wallet.winningsBalance === undefined) {
        updateFields.winningsBalance = 0;
      }
      
      if (Object.keys(updateFields).length > 0) {
        await walletsCol.updateOne({ _id: wallet._id }, { $set: updateFields });
        walletsMigrated++;
      }
    }
    console.log(`✅ Wallets migration completed. Migrated ${walletsMigrated} wallets.`);

    // --- 2. Seed / Ensure Admin Account ---
    console.log('Checking for Admin account...');
    const usersCol = db.collection('user');
    const targetAdminEmail = 'dev.jaydeep919@gmail.com';
    
    const adminUser = await usersCol.findOne({ email: targetAdminEmail });
    if (adminUser) {
      if (adminUser.role !== 'admin') {
        await usersCol.updateOne({ _id: adminUser._id }, { $set: { role: 'admin' } });
        console.log(`✅ Promoted existing user "${targetAdminEmail}" to admin.`);
      } else {
        console.log(`ℹ️ User "${targetAdminEmail}" is already admin.`);
      }
    } else {
      console.log(`⚠️ User with email "${targetAdminEmail}" not found in database. Create the account on the frontend first, then run this script again to promote them.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

migrate();
