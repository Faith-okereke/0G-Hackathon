import React from 'react';
import { Play, Pause, RefreshCw, Plus, Settings } from 'lucide-react';

interface QuickActionDeckProps {
  isPaused: boolean;
  onPauseToggle: (paused: boolean) => void;
  onNavigateToLogs: () => void;
  onNavigateToSettings: () => void;
  onAddFunds: (amount: number) => void;
}

export const QuickActionDeck: React.FC<QuickActionDeckProps> = ({
  isPaused,
  onPauseToggle,
  onNavigateToLogs,
  onNavigateToSettings,
  onAddFunds,
}) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-lg">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-border pb-2.5 mb-4">
        Agent Quick Command Deck
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Toggle Pause State directly */}
        <button
          onClick={() => onPauseToggle(!isPaused)}
          className="p-3.5 bg-surface border border-border hover:bg-[#EEECE8] group flex flex-col items-start gap-1.5 text-left transform active:scale-95 transition-all outline-none cursor-pointer"
        >
          {isPaused ? <Play className="w-4 h-4 text-green-700" /> : <Pause className="w-4 h-4 text-red-600" />}
          <div>
            <div className="text-[11px] font-bold text-white">
              {isPaused ? 'Resume Agent' : 'Pause Agent'}
            </div>
            <div className="text-[9px] text-slate-500">Deploy pause call</div>
          </div>
        </button>

        {/* View Full Log */}
        <button
          onClick={onNavigateToLogs}
          className="p-3.5 bg-surface border border-border hover:bg-[#EEECE8] group flex flex-col items-start gap-1.5 text-left transform active:scale-95 transition-all outline-none cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-[#141414]" />
          <div>
            <div className="text-[11px] font-bold text-white">View Full Log</div>
            <div className="text-[9px] text-slate-500">Compute receipts</div>
          </div>
        </button>

        {/* Faucet mock funding */}
        <button
          onClick={() => onAddFunds(1000)}
          className="p-3.5 bg-surface border border-border hover:bg-[#EEECE8] group flex flex-col items-start gap-1.5 text-left transform active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          <div>
            <div className="text-[11px] font-bold text-white">Add Funds</div>
            <div className="text-[9px] text-slate-500">Add simulation $1k</div>
          </div>
        </button>

        {/* Edit Limits Navigation */}
        <button
          onClick={onNavigateToSettings}
          className="p-3.5 bg-surface border border-border hover:bg-[#EEECE8] group flex flex-col items-start gap-1.5 text-left transform active:scale-95 transition-all outline-none cursor-pointer"
        >
          <Settings className="w-4 h-4 text-slate-700 group-hover:rotate-45 transition-transform" />
          <div>
            <div className="text-[11px] font-bold text-white">Edit Limits</div>
            <div className="text-[9px] text-slate-500">Guardrail configs</div>
          </div>
        </button>
      </div>
    </div>
  );
};
