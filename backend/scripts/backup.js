import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import config from '../services/configLoader.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || config.auth?.providers?.['better-auth']?.database?.url || 'mongodb://localhost:27017/idubbl';

async function runBackup() {
  console.log('Starting Database Backup...');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB.');
    const db = client.db();

    // Create backup directory
    const backupDirName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.resolve(process.cwd(), 'backups', backupDirName);
    
    fs.mkdirSync(backupPath, { recursive: true });
    console.log(`Created backup folder: ${backupPath}`);

    // Get all collections
    const collections = await db.listCollections().toArray();

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`Backing up collection: ${colName}...`);
      
      const documents = await db.collection(colName).find({}).toArray();
      const filePath = path.join(backupPath, `${colName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf8');
      console.log(`Collection ${colName} backed up to ${filePath}`);
    }

    console.log('Database backup completed successfully!');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

runBackup();
