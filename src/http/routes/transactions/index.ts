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

export default router;
