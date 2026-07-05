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

    // 5. Seed / Populate Currencies Collection
    console.log('Seeding currencies collection...');
    const currenciesCol = database.collection('currencies');
    
    const currenciesList = [
      { value: 'USD', label: 'USD - US Dollar', flag: '🇺🇸' },
      { value: 'NGN', label: 'NGN - Nigerian Naira', flag: '🇳🇬' },
      { value: 'GHS', label: 'GHS - Ghanaian Cedi', flag: '🇬🇭' },
      { value: 'KES', label: 'KES - Kenyan Shilling', flag: '🇰🇪' },
      { value: 'ZAR', label: 'ZAR - South African Rand', flag: '🇿🇦' },
      { value: 'EUR', label: 'EUR - Euro', flag: '🇪🇺' },
      { value: 'GBP', label: 'GBP - British Pound', flag: '🇬🇧' },
      { value: 'TZS', label: 'TZS - Tanzanian Shilling', flag: '🇹🇿' },
      { value: 'UGX', label: 'UGX - Ugandan Shilling', flag: '🇺🇬' },
      { value: 'RWF', label: 'RWF - Rwandan Franc', flag: '🇷🇼' },
      { value: 'ZMW', label: 'ZMW - Zambian Kwacha', flag: '🇿🇲' },
      { value: 'XOF', label: 'XOF - West African CFA', flag: '🇨🇮' },
      { value: 'XAF', label: 'XAF - Central African CFA', flag: '🇨🇲' },
      { value: 'CAD', label: 'CAD - Canadian Dollar', flag: '🇨🇦' },
      { value: 'AUD', label: 'AUD - Australian Dollar', flag: '🇦🇺' },
      { value: 'INR', label: 'INR - Indian Rupee', flag: '🇮🇳' },
      { value: 'AED', label: 'AED - UAE Dirham', flag: '🇦🇪' },
      { value: 'CNY', label: 'CNY - Chinese Yuan', flag: '🇨🇳' },
      { value: 'SLL', label: 'SLL - Sierra Leonean Leone', flag: '🇸🇱' },
      { value: 'LRD', label: 'LRD - Liberian Dollar', flag: '🇱🇷' },
      { value: 'MWK', label: 'MWK - Malawian Kwacha', flag: '🇲🇼' },
      { value: 'MAD', label: 'MAD - Moroccan Dirham', flag: '🇲🇦' },
      { value: 'EGP', label: 'EGP - Egyptian Pound', flag: '🇪🇬' },
      { value: 'CVE', label: 'CVE - Cape Verdean Escudo', flag: '🇨🇻' },
      { value: 'MUR', label: 'MUR - Mauritian Rupee', flag: '🇲🇺' },
      { value: 'GMD', label: 'GMD - Gambian Dalasi', flag: '🇬🇲' },
      { value: 'BIF', label: 'BIF - Burundian Franc', flag: '🇧🇮' },
      { value: 'CDF', label: 'CDF - Congolese Franc', flag: '🇨🇩' }
    ];

    for (const currency of currenciesList) {
      await currenciesCol.updateOne(
        { value: currency.value },
        { $set: currency },
        { upsert: true }
      );
    }
    console.log('✅ Currencies collection seeded successfully.');

    console.log('--- SCHEMA MIGRATION COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    process.exit(1);
  }
  process.exit(0);
}

runMigration();
