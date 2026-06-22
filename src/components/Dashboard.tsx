import React from 'react';
import { RefreshCw } from 'lucide-react';
import { DeFiPosition, DecisionLog, PerformancePoint } from '../types';
import { StatsCards } from './dashboard/StatsCards';
import { LivePositionsTable } from './dashboard/LivePositionsTable';
import { PerformanceChart } from './dashboard/PerformanceChart';
import { RecentDecisionsFeed } from './dashboard/RecentDecisionsFeed';
import { QuickActionDeck } from './dashboard/QuickActionDeck';

interface DashboardProps {
  positions: DeFiPosition[];
  decisionLogs: DecisionLog[];
  chartData: PerformancePoint[];
  isPaused: boolean;
  limits: { perTxMax: number; dailyCap: number; coSignThreshold: number };
  activeAgentKey: string;
  vaultAddress: string;
  walletAddress: string;
  onPauseToggle: (paused: boolean) => void;
  onTriggerRebalanceCycle: () => void;
  onNavigateToLogs: () => void;
  onNavigateToSettings: () => void;
  onAddFunds: (amount: number) => void;
  isTriggeringCycle: boolean;
  ethBalance?: string | null;
  ethBalanceUSD?: number | null;
  onSyncWalletBalance?: () => void;
  isSyncingWallet?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  positions = [],
  decisionLogs = [],
  chartData = [],
  isPaused,
  activeAgentKey,
  vaultAddress,
  walletAddress,
  onPauseToggle,
  onTriggerRebalanceCycle,
  onNavigateToLogs,
  onNavigateToSettings,
  onAddFunds,
  isTriggeringCycle,
  ethBalance = null,
  ethBalanceUSD = null,
  onSyncWalletBalance,
  isSyncingWallet = false,
}) => {
  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  const todaysPnLValue = 240; // Simulated $ value
  const todaysPnLPercent = 0.88; // Simulated % value
  const lastAction = decisionLogs.length > 0 ? decisionLogs[0] : null;

  // Convert time string to friendly format helper
  const getFriendlyTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Stats Banner */}
      <StatsCards
        totalValue={totalValue}
        todaysPnLValue={todaysPnLValue}
        todaysPnLPercent={todaysPnLPercent}
        isPaused={isPaused}
        activeAgentKey={activeAgentKey}
        lastAction={lastAction}
        getFriendlyTime={getFriendlyTime}
      />

      {/* Main Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (65% width) - Live Positions Table & Area Balance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <LivePositionsTable
            positions={positions}
            onTriggerRebalanceCycle={onTriggerRebalanceCycle}
            isTriggeringCycle={isTriggeringCycle}
            isPaused={isPaused}
          />

          <PerformanceChart
            chartData={chartData}
          />
        </div>

        {/* Right Column (35% width) - Recent Decisions Feed & Actions Deck */}
        <div className="space-y-6">
          <RecentDecisionsFeed
            decisionLogs={decisionLogs}
            onNavigateToLogs={onNavigateToLogs}
            getFriendlyTime={getFriendlyTime}
          />

          <QuickActionDeck
            isPaused={isPaused}
            onPauseToggle={onPauseToggle}
            onNavigateToLogs={onNavigateToLogs}
            onNavigateToSettings={onNavigateToSettings}
            onAddFunds={onAddFunds}
          />

          {/* Live MetaMask Balance Synchronization Hub */}
          <div className="border border-border bg-surface rounded-xl p-5 text-left space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white tracking-wide uppercase text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live MetaMask Balance Hub
              </h4>
              <span className="text-[9px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded uppercase font-bold">Connected</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Your real wallet balance is fetched directly from MetaMask. Synchronize your Smart Vault positions to emulate your physical asset weight.
            </p>

            <div className="bg-navy/40 border border-border/50 rounded-lg p-3 space-y-2.5 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">WALLET:</span>
                <span className="text-slate-300 font-semibold">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">METAMASK NATIVE:</span>
                <span className="text-green-400 font-bold">
                  {ethBalance !== null ? `${ethBalance} ETH` : 'Loading...'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-border/30 pt-2">
                <span className="text-slate-500">USD CONVERSION:</span>
                <span className="text-green-400 font-bold">
                  {ethBalanceUSD !== null ? `$${Math.round(ethBalanceUSD).toLocaleString()}` : '$0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">VAULT PORTFOLIO:</span>
                <span className="text-blue-400 font-semibold">
                  ${totalValue.toLocaleString()} USD
                </span>
              </div>
            </div>

            {onSyncWalletBalance && (
              <button
                onClick={onSyncWalletBalance}
                disabled={isSyncingWallet}
                className="w-full py-2 px-3 rounded bg-green-500/10 hover:bg-green-500/20 active:bg-green-500/30 border border-green-500/30 text-green-400 font-bold text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWallet ? 'animate-spin' : ''}`} />
                {isSyncingWallet ? "Synchronizing Assets..." : "Sync Vault Capital to MetaMask"}
              </button>
            )}

            {ethBalance !== null && Number(ethBalance) === 0 && (
              <p className="text-[10px] text-amber-500 leading-relaxed italic bg-amber-500/5 border border-amber-500/10 p-2.5 rounded">
                💡 Note: Your connected MetaMask wallet reports 0 ETH. To test agent actions, we recommend using the "Fund Simulation Wallet" faucet inside the action deck below!
              </p>
            )}
          </div>

          {/* Secure 0G Verification Code Block Details */}
          <div className="border border-border/60 bg-navy/30 rounded-xl p-4 text-left text-[11px] space-y-2">
            <h4 className="font-semibold text-white tracking-wide uppercase text-[10px] text-slate-400">Verified EVM Smart Vault</h4>
            <div className="font-mono text-slate-400 break-all space-y-1">
              <div><span className="text-slate-500">CONTRACT:</span> {vaultAddress || "Pending..."}</div>
              <div><span className="text-slate-500">RPC:</span> https://evmrpc-testnet.0g.ai</div>
              <div><span className="text-slate-500">OWNER KEY:</span> {walletAddress}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
