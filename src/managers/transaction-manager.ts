import ZeroDb from "@/db";
import { DbTransaction, SupportedNetwork } from "@/types";
import { Timer, Utils } from "@/utils";

namespace TransactionManager {
  let transferIdsMap = new Map<
    string,
    {
      network: SupportedNetwork;
    }
  >();

  export async function init() {
    while (true) {
      try {
        let transferId = transferIdsMap.keys().next().value;
        if (!transferId) {
          await Timer.sleep(Timer.ONE_SECOND);
          continue;
        } else {
          let transferNetwork = transferIdsMap.get(transferId)?.network;
          if (!transferNetwork) {
            transferIdsMap.delete(transferId);
            continue;
          }
          let result = await Utils.getMappingValue(
            transferNetwork,
            "transfers_status",
            transferId
          );

          if (result.result === null) {
            await markAsFinalized(transferId);
          }
        }
      } catch (error) {
        console.log("TransactionManager.init", error);
      }
    }
  }
  export async function pullFromDbToPool() {
    try {
      let transactions = (await ZeroDb.getTransactionsCollection()
        .find({
          state: "pending",
        })
        .project({ transferId: 1, network: 1 })
        .toArray()) as unknown as DbTransaction[];
      transactions.forEach((transaction) => {
        transferIdsMap.set(transaction.transferId, {
          network: transaction.network,
        });
      });
    } catch (error) {
      console.log("TransactionManager.pullFromDbToPool", error);
    }
  }
  export async function pushToPool(
    network: SupportedNetwork,
    transferId: string
  ) {
    transferIdsMap.set(transferId, { network });
    console.log(transferIdsMap.get(transferId));
  }
  export async function markAsFinalized(transferId: string) {
    try {
      // change state to finalized in db
      await ZeroDb.getTransactionsCollection().updateOne(
        { transferId },
        { $set: { state: "finalized" } }
      );
      // remove from pool
      transferIdsMap.delete(transferId);

      console.log(`Transaction ${transferId} is finalized`);
    } catch (error) {
      console.log("TransactionManager.markAsFinalized", error);
    }
  }
}

export default TransactionManager;
