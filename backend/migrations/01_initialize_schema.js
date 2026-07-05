import { client, db, getDb } from '../services/db.js';
import { initCoreIndexes } from '../services/dbIndexes.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  console.log('--- STARTING SCHEMA MIGRATION ---');
  try {
    // 1. Initialize MongoDB connection
    const database = await getDb();
    console.log('Successfully connected to database.');

    // 2. Initialize Indexes
    console.log('Initializing database indexes...');
    await initCoreIndexes();
    console.log('✅ Indexes initialized successfully.');

    // 3. Wallet Schema Migration
    console.log('Running wallet schema migration...');
    const walletsCol = database.collection('wallets');
    const wallets = await walletsCol.find({}).toArray();
    let walletsMigrated = 0;
    
    for (const wallet of wallets) {
      const updateFields = {};
      if (wallet.depositBalance === undefined) {
        updateFields.depositBalance = wallet.availableBalance !== undefined ? wallet.availableBalance : 0;
      }
      if (wallet.winningsBalance === undefined) {
        updateFields.winningsBalance = 0;
      }
      if (wallet.idubbuBalance === undefined) {
        updateFields.idubbuBalance = ((wallet.depositBalance || 0) + (wallet.winningsBalance || 0)) * 1;
      }
      if (Object.keys(updateFields).length > 0) {
        await walletsCol.updateOne({ _id: wallet._id }, { $set: updateFields });
        walletsMigrated++;
      }
    }
    console.log(`✅ Wallets migration completed. Migrated ${walletsMigrated} wallets.`);

    // 4. Ensure admin user has correct role
    console.log('Checking Admin user account role...');
    const usersCol = database.collection('user');
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
      console.log(`⚠️ User with email "${targetAdminEmail}" not found in database. Run seeding to create.`);
    }

    console.log('--- SCHEMA MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
  process.exit(0);
}

runMigration();
