import { MongoClient } from 'mongodb';

const mongoUri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function inspect() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('test');
    const users = await db.collection('user').find({}).toArray();
    console.log('Sample User Document:', users[0]);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

inspect();
