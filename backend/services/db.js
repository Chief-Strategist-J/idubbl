import { MongoClient } from 'mongodb';
import config from './configLoader.js';

const url = config.auth?.providers?.['better-auth']?.database?.url || process.env.MONGODB_URI || 'mongodb://mongodb:27017/idubbl';

let client = null;
let db = null;

export async function getDb() {
  if (db) return db;
  
  if (!client) {
    client = new MongoClient(url);
    await client.connect();
    console.log('Successfully connected to MongoDB helper');
  }
  
  db = client.db();
  return db;
}
