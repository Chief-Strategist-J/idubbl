import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://jasminecook1900_db_user:BE3UAa3WTDcOHSIW@iddubi.vfd6k9p.mongodb.net";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log("Collections:");
    console.log(collections.map(c => c.name));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

main();
