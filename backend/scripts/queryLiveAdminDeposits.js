import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function queryDeposits() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    
    for (const dbName of ['idubbl', 'test']) {
      const db = client.db(dbName);
      const deposits = await db.collection('transactions').find({ type: 'deposit' }).toArray();
      const users = await db.collection('user').find({}).toArray();
      
      console.log(`DB [${dbName}]:`);
      console.log(`  - Deposits Count: ${deposits.length}`);
      console.log(`  - Users Count: ${users.length}`);
      if (deposits.length > 0) {
        console.log(`  - Sample deposit userIds: ${deposits.map(d => d.userId).join(', ')}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

queryDeposits();
