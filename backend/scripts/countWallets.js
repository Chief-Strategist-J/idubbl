import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function countWallets() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    
    // We check both 'idubbl' and 'test' databases which exist on the cluster
    for (const dbName of ['idubbl', 'test']) {
      const db = client.db(dbName);
      
      const walletsCount = await db.collection('wallets').countDocuments({});
      const userWalletsCount = await db.collection('user_wallets').countDocuments({});
      
      console.log(`Database [${dbName}]:`);
      console.log(`  - Standard game wallets: ${walletsCount}`);
      console.log(`  - Personal crypto wallets: ${userWalletsCount}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

countWallets();
