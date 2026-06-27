import { MongoClient, ObjectId } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";
const userId = "6a381dbc3b2194ca68ba7a36";

async function simulate() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    
    for (const dbName of ['idubbl', 'test']) {
      const db = client.db(dbName);
      
      const userExists = await db.collection('user').findOne({ _id: new ObjectId(userId) });
      if (!userExists) {
        console.log(`User not found in [${dbName}]. Skipping.`);
        continue;
      }

      await db.collection('wallets').updateOne(
        { userId },
        { 
          $inc: { depositBalance: 100, pendingWithdrawals: 20 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );

      const depTx = {
        userId,
        amount: 100,
        network: 'TRC20 (TRON)',
        txHash: 'simulated_deposit_' + Date.now(),
        note: 'Simulated blockchain deposit',
        status: 'approved',
        type: 'deposit',
        createdAt: new Date()
      };
      await db.collection('transactions').insertOne(depTx);

      const withTx = {
        userId,
        amount: 20,
        network: 'TRC20 (TRON)',
        address: 'TKmmJAVnZB3PYR42VztCkqkKTGTim1ohih',
        txHash: 'simulated_withdrawal_' + Date.now(),
        note: 'Simulated withdrawal request for testing',
        status: 'pending',
        type: 'withdrawal',
        createdAt: new Date()
      };
      await db.collection('transactions').insertOne(withTx);
      
      console.log(`Successfully simulated transactions in [${dbName}] for user ${userId}.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

simulate();
