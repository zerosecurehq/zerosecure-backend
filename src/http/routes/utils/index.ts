import express from "express";
import * as TestnetSdk from "@provablehq/sdk/testnet.js";

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

export default router;
