export * from "./logger";

import { SupportedNetwork } from "@/types";

namespace Utils {
  export async function getMappingValue(
    network: SupportedNetwork,
    mapping: "balances" | "transfers_status",
    key: string
  ): Promise<{
    result: string | null;
  }> {
    return await fetch(`https://${network}.aleorpc.com`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getMappingValue",
        params: {
          program_id: process.env.ZEROSECURE_PROGRAM_ID,
          mapping_name: mapping,
          key: key,
        },
      }),
    }).then((res) => res.json());
  }
}

namespace Timer {
  export const ONE_SECOND = 1000;
  export const ONE_MINUTE = 60 * ONE_SECOND;
  export async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { Utils, Timer };
