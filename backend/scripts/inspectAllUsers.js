import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function inspect() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('test');
    const users = await db.collection('user').find({}).toArray();
    console.log('All Users:');
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, ID: ${u.id}, _ID: ${u._id?.toString()}, ReferralCode: ${u.referralCode}, ReferredBy: ${u.referredBy}`);
    });
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

inspect();
