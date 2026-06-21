import React from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { DeFiPosition } from '../../types';

interface LivePositionsTableProps {
  positions: DeFiPosition[];
  onTriggerRebalanceCycle: () => void;
  isTriggeringCycle: boolean;
  isPaused: boolean;
}

export const LivePositionsTable: React.FC<LivePositionsTableProps> = ({
  positions = [],
  onTriggerRebalanceCycle,
  isTriggeringCycle,
  isPaused,
}) => {
  // Render status badge helper
  const renderStatusPill = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-green/10 text-green-400 border border-green/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green bg-green-500" />
            Bounded
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber/10 text-amber-400 border border-amber/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber bg-amber-500" />
            Drifting
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-red/10 text-red-400 border border-red/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red bg-red-500" />
            Out of bounds
          </span>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue" />
            Live Vault Positions Table
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Asset balances currently managed on chain.</p>
        </div>

        {/* Force trigger analysis loop manually */}
        <button
          onClick={onTriggerRebalanceCycle}
          disabled={isTriggeringCycle || isPaused}
          className="h-8 px-3 bg-[#141414] hover:bg-[#2B2B2B] disabled:bg-slate-400 disabled:text-slate-600 text-white hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all outline-none border border-[#141414] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTriggeringCycle ? 'animate-spin' : ''}`} />
          {isTriggeringCycle ? 'Running AI Cycle...' : 'Trigger AI Loop'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-navy/30 text-slate-400 border-b border-border font-mono text-[10px] uppercase tracking-wider">
              <th className="p-4">Protocol & Pool</th>
              <th className="p-4 text-right">Value (USD)</th>
              <th className="p-4">Target Bound</th>
              <th className="p-4 text-center">Active Drift</th>
              <th className="p-4">Rebalanced</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {positions.map((pos) => (
              <tr key={pos.id} className="transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-navy border border-border flex items-center justify-center font-bold text-blue text-[11px]">
                      {pos.protocol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{pos.protocol}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{pos.pool}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right font-mono font-medium text-white tabular-nums">
                  ${pos.value.toLocaleString()}
                </td>
                <td className="p-4 text-slate-300 font-mono text-[11px]">
                  {pos.targetRange}
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-center gap-1.5 max-w-[100px] mx-auto">
                    <span className="font-mono text-[10px] font-semibold text-white">{pos.drift}%</span>
                    <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          pos.status === 'green' 
                            ? 'bg-green' 
                            : pos.status === 'amber'
                            ? 'bg-amber'
                            : 'bg-red'
                        }`} 
                        style={{ width: `${Math.min(100, (pos.drift / 8) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-400 text-[11px] font-mono">
                  {pos.lastRebalance}
                </td>
                <td className="p-4 text-right">
                  {renderStatusPill(pos.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
