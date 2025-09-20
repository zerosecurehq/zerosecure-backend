import { TRANSFER_MANAGER_PROGRAM_ID } from "@/const";
import ZeroDb from "@/db";
import { DbTransaction, SupportedNetwork } from "@/types";
import { Timer, Utils } from "@/utils";
import LOG from "@/utils/logger";

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
            transferId,
            TRANSFER_MANAGER_PROGRAM_ID
          );

          if (result.result === null) {
            await markAsFinalized(transferId);
          }
        }
      } catch (error) {
        LOG("error", "TransactionManager.init error: " + error);
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
      LOG("error", "TransactionManager.pullFromDbToPool error: " + error);
    }
  }
  export async function pushToPool(
    network: SupportedNetwork,
    transferId: string
  ) {
    transferIdsMap.set(transferId, { network });
    LOG(
      "sys",
      `Transaction ${transferId} is added to pool for network ${network}`
    );
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

      LOG("sys", `Transaction ${transferId} is marked as finalized`);
    } catch (error) {
      LOG("error", `TransactionManager.markAsFinalized error: ${error}`);
    }
  }

  export async function scanAndUpdate(
    transferIds: Set<string>,
    network: SupportedNetwork,
    transferId: string,
    attempt: number = 1
  ): Promise<void> {
    const pollingInterval = Timer.ONE_SECOND * 5;

    try {
      const result = await Utils.getMappingValue(
        network,
        "transfers_status",
        transferId,
        TRANSFER_MANAGER_PROGRAM_ID
      );

      if (result.result === null) {
        await markAsFinalized(transferId);
        await ZeroDb.getTransactionsCollection().updateOne(
          { transferId },
          { $set: { state: "finalized" } }
        );
        transferIds.delete(transferId);
        LOG(
          "sys",
          `Blockchain scan: Transaction ${transferId} marked as finalized after ${attempt} attempts`
        );
        return;
      }

      LOG(
        "sys",
        `Blockchain scan: Transaction ${transferId} still pending after ${attempt} attempts`
      );
      await Timer.sleep(pollingInterval);

      await scanAndUpdate(transferIds, network, transferId, attempt + 1);
    } catch (error) {
      LOG("error", `TransactionManager.scanAndUpdate error: ${error}`);

      await ZeroDb.getTransactionsCollection().updateOne(
        { transferId },
        { $set: { state: "failed" } }
      );
      transferIds.delete(transferId);
      LOG("sys", `Transaction ${transferId} marked as failed due to error`);
    }
  }
}

export default TransactionManager;
