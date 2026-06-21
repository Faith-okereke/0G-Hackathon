import React from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { DecisionLog } from '../../types';

interface RecentDecisionsFeedProps {
  decisionLogs: DecisionLog[];
  onNavigateToLogs: () => void;
  getFriendlyTime: (dateStr: string) => string;
}

export const RecentDecisionsFeed: React.FC<RecentDecisionsFeedProps> = ({
  decisionLogs = [],
  onNavigateToLogs,
  getFriendlyTime,
}) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Recent Decisions Feed</h3>
        <button 
          onClick={onNavigateToLogs}
          className="text-[#141414] hover:text-[#5C5C5C] text-[10px] font-bold flex items-center gap-0.5 uppercase tracking-wide cursor-pointer"
        >
          Log Archive
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[17px] before:w-[1px] before:bg-border">
        {decisionLogs.slice(0, 5).map((log, index) => (
          <div key={log.id || index} className="flex gap-3 text-left relative z-10">
            {/* Circle action marker */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border flex-shrink-0 bg-surface ${
              log.action === 'REBALANCE' 
                ? 'border-blue/40 text-blue font-semibold' 
                : log.action === 'FAILED'
                ? 'border-red/40 text-red-500'
                : 'border-border text-slate-400'
            }`}>
              {log.action === 'REBALANCE' ? '⚡' : '●'}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-white">
                  {log.action} • {log.protocol}
                </span>
                {log.status === 'verified' && (
                  <span className="text-green text-green-400 flex items-center gap-0.5 text-[9px] font-mono" title="Compute and Storage verified on 0G">
                    <CheckCircle className="w-3 h-3 text-green text-green-500 fill-green-500/10" />
                    0G PRF
                  </span>
                )}
              </div>
              
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {log.reasoning}
              </p>
              
              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500 font-mono">
                <span>{getFriendlyTime(log.timestamp)}</span>
                {log.action === 'REBALANCE' && <span className="text-white">${log.amount} USD</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
