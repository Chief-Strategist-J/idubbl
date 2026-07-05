import { MongoClient } from 'mongodb';
import config from './configLoader.js';

const url = process.env.MONGODB_URI || config.auth?.providers?.['better-auth']?.database?.url || 'mongodb://mongodb:27017/idubbl';

export const client = new MongoClient(url);
export const db = client.db();

let connected = false;

export async function getDb() {
  if (!connected) {
    await client.connect();
    connected = true;
    console.log('Successfully connected to MongoDB helper');
  }
  return db;
}
