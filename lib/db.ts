import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const DB_NAME = 'dhyeyvault';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDB(): Promise<Db> {
  if (db) return db;
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  db = client.db(DB_NAME);
  return db;
}

export async function getCollection<T extends object>(name: string) {
  const database = await getDB();
  return database.collection<T>(name);
}
