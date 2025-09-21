export interface DbTransaction {
  network: SupportedNetwork;
  state: TransactionState;
  timestamp: number;
  walletAddress: string;
  transferId: string;
  data: string;
  publicKey?: string;
  to: string;
  amount: number;
  from: string;
}

export type SupportedNetwork = "testnetbeta" | "mainnet";
export type TransactionState = "pending" | "finalized" | "failed";
