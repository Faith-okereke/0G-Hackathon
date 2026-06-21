import React, { useState } from 'react';
import { 
  ShieldAlert, Shield, ShieldCheck, Key, Play, Pause, Trash2, Download, Settings, Sliders, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPageProps {
  limits: { perTxMax: number; dailyCap: number; coSignThreshold: number };
  whitelistedProtocols: string[];
  activeAgentKey: string;
  isPaused: boolean;
  vaultAddress: string;
  onUpdateLimits: (newLimits: { perTxMax: number; dailyCap: number; coSignThreshold: number }) => void;
  onUpdateProtocols: (protocols: string[]) => void;
  onRotateKey: () => void;
  onPauseToggle: (paused: boolean) => void;
  onWithdrawFunds: () => void;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  limits,
  whitelistedProtocols = [],
  activeAgentKey,
  isPaused,
  vaultAddress,
  onUpdateLimits,
  onUpdateProtocols,
  onRotateKey,
  onPauseToggle,
  onWithdrawFunds,
  toast,
}) => {
  // Edit limits modal
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [perTxMax, setPerTxMax] = useState(limits.perTxMax);
  const [dailyCap, setDailyCap] = useState(limits.dailyCap);
  const [coSignThreshold, setCoSignThreshold] = useState(limits.coSignThreshold);

  // Danger zone confirmations
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const protocolsList = [
    { name: "Uniswap v3", desc: "Automate liquidity concentration tick bounds." },
    { name: "Aave v3", desc: "Rebalance lending locks securely on lending rates." },
    { name: "Curve", desc: "Manage stable pools peg ratios dynamically." },
    { name: "Compound", desc: "Multi-yield landing pools and dynamic interest tracking." },
  ];

  const handleToggleWhitelist = (name: string) => {
    let updated: string[];
    if (whitelistedProtocols.includes(name)) {
      updated = whitelistedProtocols.filter(p => p !== name);
    } else {
      updated = [...whitelistedProtocols, name];
    }
    onUpdateProtocols(updated);
  };

  const handleSaveLimits = () => {
    onUpdateLimits({ perTxMax, dailyCap, coSignThreshold });
    setShowLimitsModal(false);
  };

  const executeEmergencyPause = () => {
    if (confirmInput !== 'CONFIRM') {
      toast('error', 'Type CONFIRM exactly to proceed.');
      return;
    }
    onPauseToggle(!isPaused);
    setShowPauseConfirm(false);
    setConfirmInput('');
  };

  const executeEmergencyWithdraw = () => {
    if (confirmInput !== 'CONFIRM') {
      toast('error', 'Type CONFIRM exactly to proceed.');
      return;
    }
    onWithdrawFunds();
    setShowWithdrawConfirm(false);
    setConfirmInput('');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Title block */}
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue" />
          On-chain Security Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          These policies are enforced directly inside the deployed EVM vault bytecode on the 0G Chain.
        </p>
      </div>

      {/* Grid of Settings sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Section 1: Spending Limits */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-border pb-2.5">
              <Sliders className="w-4 h-4 text-blue" />
              1. Vault Spending Guardrails
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-navy/40 rounded-lg border border-border/60">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Per-Tx Max</span>
                <p className="text-sm font-bold font-mono text-white mt-1">${limits.perTxMax}</p>
              </div>
              <div className="p-3 bg-navy/40 rounded-lg border border-border/60">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Daily Limit</span>
                <p className="text-sm font-bold font-mono text-white mt-1">${limits.dailyCap}</p>
              </div>
              <div className="p-3 bg-navy/40 rounded-lg border border-border/60">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Co-Sign Min</span>
                <p className="text-sm font-bold font-mono text-white mt-1">${limits.coSignThreshold}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-2">
              Our smart contract enforces that transactions above the Co-Sign Minimum trigger physical multi-sig constraints requiring a manual co-signature before submitting blocks on the 0G chain.
            </p>
          </div>

          <button
            onClick={() => {
              setPerTxMax(limits.perTxMax);
              setDailyCap(limits.dailyCap);
              setCoSignThreshold(limits.coSignThreshold);
              setShowLimitsModal(true);
            }}
            className="w-full h-10 bg-transparent hover:bg-[#EEECE8] border border-[#141414] text-[#141414] font-bold text-xs uppercase cursor-pointer transition-all mt-4"
          >
            Modify Spending Limits
          </button>
        </div>

        {/* Section 2: Whitelisted Contracts */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-border pb-2.5 animate-none">
            <Shield className="w-4 h-4 text-green-500 animate-none" />
            2. Whitelisted Protocols
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {protocolsList.map((proto) => {
              const isChecked = whitelistedProtocols.includes(proto.name);
              return (
                <div
                  key={proto.name}
                  onClick={() => handleToggleWhitelist(proto.name)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                    isChecked 
                      ? 'border-green/35 bg-green/5' 
                      : 'border-border/60 bg-surface/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="text-left">
                    <span className="font-semibold text-xs text-white">{proto.name}</span>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[130px]">{proto.desc}</p>
                  </div>
                  <div className={`w-4.5 h-4.5 rounded-sm border flex items-center justify-center ${
                    isChecked ? 'bg-green border-green text-green-400' : 'border-border'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Key Rotation */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-border pb-2.5">
              <Key className="w-4 h-4 text-blue" />
              3. Delegated Agent Signing Session Key
            </h3>

            <div className="p-3 bg-navy/40 rounded border border-border/80 flex justify-between items-center text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-500 uppercase block">Active Session Key:</span>
                <span className="text-slate-200">{activeAgentKey}</span>
              </div>
              <span className="text-[10px] text-green-400 font-semibold px-2 py-0.5 bg-green/15 rounded uppercase tracking-wider border border-green/10">Active</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Rotating session delegation will issue a fresh cryptography signature from your master hardware wallet and register it on the AegisZeroVault. Update your remote scripts immediately following rotation.
            </p>
          </div>

          <button
            onClick={onRotateKey}
            className="w-full h-10 bg-transparent hover:bg-[#EEECE8] border border-[#141414] text-[#141414] font-bold text-xs uppercase cursor-pointer transition-all mt-4"
          >
            Rotate Agent Signing Session Key
          </button>
        </div>

        {/* Section 4: Danger Zone */}
        <div className="bg-surface border border-red/30 rounded-xl p-5 space-y-4 shadow-lg border-l-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5 border-b border-border pb-2.5">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            4. Emergency Operations Center (Danger Zone)
          </h3>

          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-red/5 border border-red/10 rounded-lg">
              <div className="text-left">
                <span className="font-semibold text-xs text-white">Emergency Protocol Interruption</span>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm">
                  Pause the agent. Stops all automated rebalancing activity immediately until manual reactivation.
                </p>
              </div>
              <button
                onClick={() => {
                  setConfirmInput('');
                  setShowPauseConfirm(true);
                }}
                className={`h-8 font-bold text-xs uppercase tracking-wide px-3.5 rounded transition-colors w-full sm:w-auto text-center cursor-pointer ${
                  isPaused ? 'bg-green hover:bg-green-600 text-white' : 'bg-red hover:bg-red-700 text-white'
                }`}
              >
                {isPaused ? 'Resume Agent' : 'Pause Agent'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-red/5 border border-red/10 rounded-lg">
              <div className="text-left">
                <span className="font-semibold text-xs text-white">Sweep Vault & Withdraw Capital</span>
                <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm">
                  Immediately sweep all whitelisted pools and transfer vault funds securely back to your owner hardware address.
                </p>
              </div>
              <button
                onClick={() => {
                  setConfirmInput('');
                  setShowWithdrawConfirm(true);
                }}
                className="h-8 bg-red hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wide px-3.5 rounded transition-colors w-full sm:w-auto text-center cursor-pointer whitespace-nowrap"
              >
                Withdraw All Assets
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Edit limits modal container */}
      <AnimatePresence>
        {showLimitsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-xl p-6 max-w-md w-full text-left font-sans shadow-2xl"
            >
              <h3 className="text-md font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sliders className="text-blue" />
                Change Custom On-Chain Limits
              </h3>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Per-Transaction Limit</span>
                    <span className="text-blue font-mono font-bold">${perTxMax}</span>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={perTxMax}
                    onChange={(e) => setPerTxMax(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-blue"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Daily Spending Cap</span>
                    <span className="text-blue font-mono font-bold">${dailyCap}</span>
                  </div>
                  <input 
                    type="range"
                    min="100"
                    max="20000"
                    step="100"
                    value={dailyCap}
                    onChange={(e) => setDailyCap(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-blue"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span>Co-Sign Approval Threshold</span>
                    <span className="text-blue font-mono font-bold">${coSignThreshold}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={coSignThreshold}
                    onChange={(e) => setCoSignThreshold(Number(e.target.value))}
                    className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-blue"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button
                  onClick={() => setShowLimitsModal(false)}
                  className="px-4 py-2 border border-border text-slate-300 hover:bg-white/10 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimits}
                  className="px-4 py-2 bg-[#141414] hover:bg-[#2B2B2B] text-white hover:text-white text-xs font-bold uppercase tracking-wider border border-border cursor-pointer transition-all duration-150 rounded"
                >
                  Apply & Transact limits
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pause agent confirmation modal */}
      <AnimatePresence>
        {showPauseConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-red/40 rounded-xl p-6 max-w-sm w-full text-left shadow-2xl border-t-4"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="text-red-500" />
                Emergency Interruption Check
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                You are about to pause the Aegis Zero autonomous rebalancing cycles. This stops all automated LP realignment loops. 
              </p>
              
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Type CONFIRM to proceed:</label>
                <input
                  type="text"
                  placeholder="CONFIRM"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full h-9 px-3 bg-navy border border-border rounded text-xs font-mono text-white placeholder-slate-600 focus:border-red/50 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowPauseConfirm(false); setConfirmInput(''); }}
                  className="px-4 h-9 border border-border text-slate-300 rounded text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={executeEmergencyPause}
                  className="px-4 h-9 bg-red hover:bg-red-700 text-white rounded text-xs font-semibold uppercase"
                >
                  Apply Interruption
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw funds confirmation modal */}
      <AnimatePresence>
        {showWithdrawConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-red/40 rounded-xl p-6 max-w-sm w-full text-left shadow-2xl border-t-4"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Trash2 className="text-red-500 animate-pulse" />
                Sweep & Liquidate Vault capital
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                You are about to execute an immutable sweep on-chain. This will exit all liquidity ranges and return the assets back to owner address. This action is irreversible.
              </p>
              
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Type CONFIRM to proceed:</label>
                <input
                  type="text"
                  placeholder="CONFIRM"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="w-full h-9 px-3 bg-navy border border-border rounded text-xs font-mono text-white placeholder-slate-600 focus:border-red/50 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowWithdrawConfirm(false); setConfirmInput(''); }}
                  className="px-4 h-9 border border-border text-slate-300 rounded text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={executeEmergencyWithdraw}
                  className="px-4 h-9 bg-red hover:bg-red-700 text-white rounded text-xs font-semibold uppercase"
                >
                  Sweep & Liquidate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
