import React from 'react';
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
