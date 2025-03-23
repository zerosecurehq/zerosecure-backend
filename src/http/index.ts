import express from "express";
import utilsRouter from "./routes/utils/";
import transactionsRouter from "./routes/transactions/";

const router = express.Router({ mergeParams: true });

namespace Http {
  export async function createHttpServer() {
    const app = express();
    app.use(express.json());

    router.use((req, res, next) => {
      const network = req.params.network;
      if (network !== "testnetbeta" && network !== "mainnet") {
        res.status(400).send("Invalid network");
      } else {
        req.network = network;
        next();
      }
    });
    router.use("/utils", utilsRouter);
    router.use("/transactions", transactionsRouter);

    app.use("/:network", router);

    app.listen(process.env.HTTP_PORT, () => {
      console.log(`Server is running on port ${process.env.HTTP_PORT}`);
    });
  }
}

export default Http;
