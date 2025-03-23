export interface DbTransaction {
  // we use snake_case for consistency with the wallet and contract
  network: SupportedNetwork;
  state: TransactionState;
  timestamp: number;
  walletAddress: string;
  transferId: string;
  data: string;
}

export type SupportedNetwork = "testnetbeta" | "mainnet";
export type TransactionState = "pending" | "finalized" | "failed";
