import express from "express";
import { Utils } from "@/utils";
import { DbTransaction } from "@/types";
import ZeroDb from "@/db";
import TransactionManager from "@/managers/transaction-manager";
import { Hasher } from "@doko-js/wasm";
import LOG from "@/utils/logger";

const router = express.Router();

router.get("/:address", async (req, res) => {
  try {
    let offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    let limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    let walletAddress = req.params.address;

    if (!walletAddress) {
      res.status(400).send("Address is required");
    }

    const transactions = (await ZeroDb.getTransactionsCollection()
      .find({
        walletAddress: walletAddress,
      })
      .sort({
        timestamp: -1,
      })
      .skip(offset)
      .limit(limit)
      .toArray()) as unknown as DbTransaction[];
    res.send(transactions);
  } catch (error) {
    res.status(500).send(`${error}`);
  }
});

router.post("/", async (req, res) => {
  try {
    const walletAddress = req.body.wallet_address;
    const transferId = req.body.transfer_id;
    const transaction = req.body.data as string; // encrypted transaction

    if (!transaction) {
      res.status(400).send("Transaction is required");
      return;
    }
    if (!walletAddress) {
      res.status(400).send("Wallet address is required");
      return;
    }
    if (!transferId) {
      res.status(400).send("Transfer id is required");
      return;
    }

    let walletHashedToField: string = Hasher.hash(
      "bhp256",
      walletAddress,
      "field",
      {
        mainnet: "mainnet",
        testnetbeta: "testnet",
      }[req.network]
    );
    if (walletHashedToField.includes(" ")) {
      throw new Error("Invalid wallet address");
    }
    if (
      (
        await Utils.getMappingValue(
          req.network,
          "balances",
          Hasher.hash(
            "bhp256",
            walletAddress,
            "field",
            {
              mainnet: "mainnet",
              testnetbeta: "testnet",
            }[req.network]
          )
        )
      ).result === null
    ) {
      res.status(400).send("Wallet does not exist");
      return;
    }
    await ZeroDb.getTransactionsCollection().insertOne({
      network: req.network,
      state: "pending",
      timestamp: new Date().getTime(),
      walletAddress,
      transferId,
      data: transaction,
    } as DbTransaction);
    TransactionManager.pushToPool(req.network, transferId);
    res.send("");
  } catch (error) {
    LOG("error", "Error while inserting transaction: " + error);
    res.status(500).send(`${error}`);
  }
});

router.post("/saveTransfer", async (req, res) => {
  try {
    const {
      from,
      to,
      amount,
      timestamp,
      status,
      transferId,
      publicKey,
      encryptedData,
    } = req.body as {
      from: string;
      to: string;
      amount: number;
      timestamp: number;
      status: "pending" | "finalized" | "failed";
      transferId: string;
      publicKey: string;
      encryptedData?: string;
    };

    if (
      !from ||
      !to ||
      amount === undefined ||
      !timestamp ||
      !status ||
      !transferId ||
      !publicKey ||
      !encryptedData
    ) {
      res
        .status(400)
        .send(
          "Missing required fields: from, to, amount, timestamp, status, transferId, or publicKey"
        );
      return;
    }

    if (!["pending", "finalized", "failed"].includes(status)) {
      res
        .status(400)
        .send("Invalid status: must be pending, finalized, or failed");
      return;
    }

    const walletHashedToField: string = Hasher.hash(
      "bhp256",
      from,
      "field",
      {
        mainnet: "mainnet",
        testnetbeta: "testnet",
      }[req.network]
    );
    if (walletHashedToField.includes(" ")) {
      throw new Error("Invalid wallet address");
    }

    const mappingResponse = await Utils.getMappingValue(
      req.network,
      "balances",
      walletHashedToField
    );
    if (mappingResponse.result === null) {
      res.status(400).send("Wallet does not exist");
      return;
    }

    const transaction: DbTransaction = {
      network: req.network,
      state: status,
      timestamp,
      walletAddress: from,
      transferId,
      data: encryptedData,
      publicKey,
      to,
      amount,
    };

    await ZeroDb.getTransactionsCollection().insertOne(transaction);

    TransactionManager.pushToPool(req.network, transferId);
    res.send("Transfer saved");
    TransactionManager.scanBlockchainUntilResult(req.network, transferId);
  } catch (error) {
    LOG("error", `Error while saving transfer: ${error}`);
    res.status(500).send(`${error}`);
  }
});

router.get("/getTransfers", async (req, res) => {
  try {
    const publicKey = req.query.publicKey as string;
    let offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    let limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!publicKey) {
      res.status(400).send("publicKey is required");
      return;
    }

    const transactions = (await ZeroDb.getTransactionsCollection()
      .find({
        publicKey,
        network: req.network,
      })
      .sort({
        timestamp: -1,
      })
      .skip(offset)
      .limit(limit)
      .toArray()) as unknown as DbTransaction[];

    const rawHistory = transactions.map((tx) => ({
      from: tx.walletAddress,
      encryptedData: tx.data,
      timestamp: tx.timestamp,
      transferId: tx.transferId,
      status: tx.state,
    }));

    res.send(rawHistory);
  } catch (error) {
    LOG("error", `Error while fetching transfers: ${error}`);
    res.status(500).send(`${error}`);
  }
});

export default router;
