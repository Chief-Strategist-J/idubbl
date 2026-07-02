import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function migrate() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('test');
    const users = await db.collection('user').find({ referralCode: { $exists: false } }).toArray();
    console.log(`Found ${users.length} users missing referral codes.`);

    for (const u of users) {
      let referralCode = '';
      let exists = true;
      while (exists) {
        referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const found = await db.collection('user').findOne({ referralCode });
        if (!found) {
          exists = false;
        }
      }
      await db.collection('user').updateOne(
        { _id: u._id },
        { $set: { referralCode } }
      );
      console.log(`Generated code ${referralCode} for user: ${u.name || u.email}`);
    }
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await client.close();
  }
}

migrate();
