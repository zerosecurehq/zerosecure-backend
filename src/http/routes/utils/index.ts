import express from "express";
import * as TestnetSdk from "@provablehq/sdk/testnet.js";
import { Hasher } from "@doko-js/wasm";

const router = express.Router();

router.get("/randomAddress", (_, res) => {
  try {
    let randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    let random_address = TestnetSdk.Address.from_private_key(
      TestnetSdk.PrivateKey.from_seed_unchecked(randomBytes)
    );
    res.send(random_address.to_string());
  } catch (error) {
    res.status(500).send("An error occurred while generating a random address");
  }
});

router.get("/randomField", (_, res) => {
  try {
    res.send(TestnetSdk.Field.random().toString());
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while generating a random field element");
  }
});

router.post("/hashAddressToField", (req, res) => {
  try {
    let walletAddress = req.body.wallet_address;
    if (!walletAddress) {
      res.status(400).send("Wallet address is required");
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
    res.send(walletHashedToField);
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while hashing the address to field");
  }
});

router.post("/hashBalanceKeyToField", async (req, res) => {
  try {
    let walletAddress: string = req.body.wallet_address;
    let tokenId: string = req.body.token_id;
    if (!walletAddress || !tokenId) {
      res.status(400).send("Wallet address and token id are required");
      return;
    }
    const hashedValue = Hasher.hash(
      "bhp256",
      `{wallet_address: ${walletAddress}, token_id: ${tokenId}}`, // input value
      "field",
      {
        mainnet: "mainnet",
        testnetbeta: "testnet",
      }[req.network]
    );
    res.send(hashedValue);
  } catch (error) {
    res
      .status(500)
      .send("An error occurred while hashing the balance key to field");
  }
});

export default router;
