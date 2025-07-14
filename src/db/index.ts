import LOG from "@/utils/logger";
import { Db, MongoClient } from "mongodb";

namespace ZeroDb {
  const url = process.env.MONGODB_URI as string;

  // Database Name
  const dbName = "zerosecure";
  let db: Db;

  export async function connect() {
    if (!url) {
      LOG(
        "warning",
        "MONGODB_URI is not set, all database operations will throw errors"
      );
      return;
    }
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    LOG("sys", "Connected to MongoDB at " + url);
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
