import { Db, MongoClient } from "mongodb";

namespace ZeroDb {
  const url = process.env.MONGODB_URI as string;

  // Database Name
  const dbName = "zerosecure";
  let db: Db;

  export async function connect() {
    if (!url) {
      return console.log(
        "WARNING: MONGODB_URI is not set, all database operations will throw errors"
      );
    }
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    console.log("Connected successfully to mongodb server " + url);
  }

  export function getDb() {
    if (!db) {
      throw new Error("Must connect to database first");
    }
    return db;
  }

  export function getTransactionsCollection() {
    const db = getDb();
    return db.collection("transactions");
  }
}

export default ZeroDb;
