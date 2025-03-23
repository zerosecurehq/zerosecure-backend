import { Db, MongoClient } from "mongodb";

namespace ZeroDb {
  const url = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const client = new MongoClient(url);

  // Database Name
  const dbName = "zerosecure";
  let db: Db;

  export async function connect() {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected successfully to mongodb server " + url);
  }

  export function getDb() {
    return db;
  }

  export function getTransactionsCollection() {
    const db = getDb();
    return db.collection("transactions");
  }
}

export default ZeroDb;
