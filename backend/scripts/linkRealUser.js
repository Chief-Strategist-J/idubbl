import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";
const realUserId = "6a381dbc3b2194ca68ba7a36";

async function linkData() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('test');

    // 1. Move personal wallets
    const wallet = await db.collection('user_wallets').findOne({ userId: 'u1' });
    if (wallet) {
      await db.collection('user_wallets').updateOne(
        { userId: realUserId },
        {
          $set: {
            tron: wallet.tron,
            ethereum: wallet.ethereum,
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );
      await db.collection('user_wallets').deleteOne({ userId: 'u1' });
      console.log('Moved personal wallet addresses.');
    }

    // 2. Transfer standard wallet balance
    const u1WalletObj = await db.collection('wallets').findOne({ userId: 'u1' });
    if (u1WalletObj) {
      await db.collection('wallets').updateOne(
        { userId: realUserId },
        { $inc: { depositBalance: u1WalletObj.depositBalance || 50 } },
        { upsert: true }
      );
      await db.collection('wallets').deleteOne({ userId: 'u1' });
      console.log('Moved standard game wallet balances.');
    }

    // 3. Re-assign transactions
    const result = await db.collection('transactions').updateMany(
      { userId: 'u1' },
      { $set: { userId: realUserId } }
    );
    console.log('Updated transactions count:', result.modifiedCount);

  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

linkData();
