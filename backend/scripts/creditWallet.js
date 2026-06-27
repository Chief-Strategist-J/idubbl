import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function findDb() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const adminDb = client.db().admin();
    const dbsInfo = await adminDb.listDatabases();
    console.log('Databases on cluster:', dbsInfo.databases.map(d => d.name));

    for (const d of dbsInfo.databases) {
      const dbInstance = client.db(d.name);
      const cols = await dbInstance.listCollections().toArray();
      const colNames = cols.map(c => c.name);
      if (colNames.includes('wallets')) {
        console.log(`Found 'wallets' in database: ${d.name}`);
        
        // Credit u1's wallet in the correct DB
        const walletResult = await dbInstance.collection('wallets').updateOne(
          { userId: 'u1' },
          { $inc: { depositBalance: 50 } }
        );
        console.log('Wallet update result:', walletResult);

        const tx = {
          userId: 'u1',
          amount: 50,
          network: 'TRC20 (TRON)',
          txHash: 'tx_live_test_' + Date.now(),
          note: 'Live flow test credit',
          status: 'approved',
          type: 'deposit',
          createdAt: new Date()
        };
        await dbInstance.collection('transactions').insertOne(tx);
        console.log('Transaction logged in correct database.');
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

findDb();
