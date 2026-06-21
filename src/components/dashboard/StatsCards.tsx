import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DecisionLog } from '../../types';

interface StatsCardsProps {
  totalValue: number;
  todaysPnLValue: number;
  todaysPnLPercent: number;
  isPaused: boolean;
  activeAgentKey: string;
  lastAction: DecisionLog | null;
  getFriendlyTime: (dateStr: string) => string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalValue,
  todaysPnLValue,
  todaysPnLPercent,
  isPaused,
  activeAgentKey,
  lastAction,
  getFriendlyTime,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Portfolio Value */}
      <motion.div 
        className="bg-surface border border-border rounded-xl p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Vault Portfolio Value</span>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold font-mono text-white tabular-nums">
            ${totalValue.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 font-mono">USD</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-green-500 mt-1 font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          +1.2% this cycle
        </div>
      </motion.div>

      {/* Card 2: Today's P&L */}
      <motion.div 
        className="bg-surface border border-border rounded-xl p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today's P&L</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-2xl font-bold font-mono text-green-400 tabular-nums">
            +${todaysPnLValue}
          </span>
          <span className="text-xs text-slate-500 font-mono">USD</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-green-400 mt-1 font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          +{todaysPnLPercent}% daily yield
        </div>
      </motion.div>

      {/* Card 3: Agent Status */}
      <motion.div 
        className="bg-surface border border-border rounded-xl p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Autonomous Agent Status</span>
        <div className="mt-2.5 flex items-center gap-2">
          {!isPaused ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-green/10 text-green-400 border border-green-500/30">
              <span className="w-2 h-2 pr border bg-green bg-green-500 rounded-full pulse-green" />
              RUNNING
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red/10 text-red border border-red-500/30">
              <span className="w-2 h-2 rounded-full bg-red bg-red-500" />
              PAUSED
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-2">
          Key: {activeAgentKey || 'N/A'}
        </div>
      </motion.div>

      {/* Card 4: Last Action */}
      <motion.div 
        className="bg-surface border border-border rounded-xl p-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Action Outcome</span>
        <div className="mt-2.5 flex items-center gap-2">
          {lastAction ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  lastAction.action === 'REBALANCE' ? 'bg-blue/20 text-blue-400 border border-blue/30' : 'bg-slate-800 text-slate-300'
                }`}>
                  {lastAction.action}
                </span>
                <span className="text-xs font-semibold text-white">{lastAction.protocol}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">
                {getFriendlyTime(lastAction.timestamp)} ({lastAction.action === 'REBALANCE' ? `$${lastAction.amount}` : 'No Drift'})
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">No actions recorded</span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
