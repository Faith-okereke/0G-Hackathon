export interface DeFiPosition {
  id: string;
  protocol: 'Uniswap v3' | 'Aave v3' | 'Curve' | 'Compound';
  pool: string;
  value: number;
  targetRange: string;
  drift: number; // percentage
  lastRebalance: string; // duration ago
  status: 'green' | 'amber' | 'red';
  tokenA: string;
  tokenB: string;
}

export interface DecisionLog {
  id: string;
  timestamp: string;
  cycleNumber: number;
  action: 'REBALANCE' | 'HOLD' | 'ALERT' | 'FAILED';
  protocol: string;
  amount: number;
  reasoning: string;
  receiptHash: string;
  txHash: string;
  status: 'verified' | 'pending' | 'failed' | 'rejected';
  inputState: {
    positions: DeFiPosition[];
    prices: Record<string, number>;
    limits: VaultLimits;
  };
}

export interface VaultLimits {
  perTxMax: number; // USD
  dailyCap: number; // USD
  coSignThreshold: number; // USD
  cooldownPeriod: number; // seconds
}

export interface VaultState {
  address: string;
  ownerAddress: string;
  agentAddress: string;
  limits: VaultLimits;
  whitelistedProtocols: string[];
  isPaused: boolean;
  funds: number; // simulated wallet balance
}

export interface PerformancePoint {
  date: string;
  value: number;
  actionMarker?: {
    type: 'REBALANCE' | 'ALERT' | 'PAID' | 'PAUSE';
    label: string;
  };
}
