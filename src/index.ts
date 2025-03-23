import "dotenv/config";
import "log-timestamp";
import ZeroDb from "./db";
import { SupportedNetwork } from "./types";
import TransactionManager from "./managers/transaction-manager";
import Http from "./http";

declare global {
  namespace Express {
    interface Request {
      network: SupportedNetwork;
    }
  }
}

async function main() {
  await ZeroDb.connect();
  await Http.createHttpServer();
  // modules that work on background
  TransactionManager.init();
}

main();
