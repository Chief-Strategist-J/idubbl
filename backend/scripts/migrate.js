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

    // --- 3. Seed / Populate Currencies Collection ---
    console.log('Seeding currencies collection...');
    const currenciesCol = db.collection('currencies');
    
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

    // --- 4. Ensure Existing Users have emailVerified: true ---
    console.log('Ensuring existing users have emailVerified status...');
    const verifyResult = await usersCol.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true } }
    );
    console.log(`✅ User verification status migration completed. Verified ${verifyResult.modifiedCount} accounts.`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

migrate();
