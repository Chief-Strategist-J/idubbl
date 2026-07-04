import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not set in environment or .env file');
  process.exit(1);
}

async function resetDb() {
  console.log('Connecting to database...');
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    const collectionsInfo = await db.listCollections().toArray();
    const collections = collectionsInfo.map(c => c.name);
    
    console.log('Dropping collections...');
    for (const colName of collections) {
      try {
        await db.collection(colName).drop();
        console.log(`✅ Dropped collection: ${colName}`);
      } catch (err) {
        if (err.codeName === 'NamespaceNotFound') {
          console.log(`ℹ️ Collection ${colName} does not exist, skipping.`);
        } else {
          console.error(`❌ Error dropping collection ${colName}:`, err.message);
        }
      }
    }
    
    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

resetDb();
