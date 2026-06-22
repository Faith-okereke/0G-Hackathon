import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Settings, Server, Check, Loader2, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OnboardingWizardProps {
  walletAddress: string;
  onComplete: (data: {
    perTxMax: number;
    dailyCap: number;
    coSignThreshold: number;
    protocols: string[];
    vaultAddress: string;
  }) => void;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ walletAddress, onComplete, toast }) => {
  const [step, setStep] = useState(1);
  
  // State for limits (Step 1)
  const [perTxMax, setPerTxMax] = useState(500);
  const [dailyCap, setDailyCap] = useState(2000);
  const [coSignThreshold, setCoSignThreshold] = useState(1000);

  // State for protocols (Step 2)
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>(["Uniswap v3", "Aave v3"]);

  // Deploy simulation (Step 3)
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStepIndex, setDeployStepIndex] = useState(0);

  const protocolsList = [
    { name: "Uniswap v3", desc: "Automate Uniswap concentrated liquidity pools. Reallocate tick ranges dynamically when in-place balances drift.", defaultEnabled: true },
    { name: "Aave v3", desc: "Optimize yield by switching borrow or supply collateral. Rebalances deposits to highest APY pools safe from liquidation.", defaultEnabled: true },
    { name: "Curve", desc: "Stable asset pools. Reallocate liquidity vectors when pool peg parameters drift outside safe guidelines.", defaultEnabled: false },
    { name: "Compound", desc: "Multi-yield landing pools. Dynamic interest tracking on collateral balances.", defaultEnabled: false },
  ];

  const handleToggleProtocol = (name: string) => {
    if (selectedProtocols.includes(name)) {
      setSelectedProtocols(selectedProtocols.filter(p => p !== name));
    } else {
      setSelectedProtocols([...selectedProtocols, name]);
    }
  };

  const deployMessages = [
    "Compiling AegisZeroVault contract bytecode...",
    "Signing deploy transaction matrix via 0G Testnet...",
    "Waiting for block execution consensus...",
    "Constructing verifiable storage root on 0G Storage...",
    "Vault deployed successfully!"
  ];

  const handleStartDeploy = async () => {
    setIsDeploying(true);
    setDeployStepIndex(0);

    const runDeployTicker = (idx: number) => {
      if (idx < deployMessages.length - 1) {
        setTimeout(() => {
          setDeployStepIndex(idx + 1);
          runDeployTicker(idx + 1);
        }, 1200);
      } else {
        // Build actual request to server to mock state initialization
        setTimeout(async () => {
          try {
            const res = await fetch('/api/onboarding', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                address: walletAddress,
                perTxMax,
                dailyCap,
                coSignThreshold,
                protocols: selectedProtocols
              })
            });
            const data = await res.json();
            if (data.success) {
              toast('success', 'Smart Contract Vault deployed on 0G Testnet with verified limits.');
              onComplete({
                perTxMax,
                dailyCap,
                coSignThreshold,
                protocols: selectedProtocols,
                vaultAddress: data.vaultAddress
              });
            } else {
              toast('error', 'Deployment failed. Please check network logs.');
            }
          } catch (e) {
            toast('error', 'Network communication error during deployment.');
          } finally {
            setIsDeploying(false);
          }
        }, 800);
      }
    };

    runDeployTicker(0);
  };

  return (
    <div className="min-h-screen bg-navy py-12 px-4 flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-[#E4E3E0] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-xl w-full bg-[#D9D8D5] border-2 border-[#141414] p-5 sm:p-8 shadow-none relative z-10 transition-all">
        
        {/* Step Progression Indicators */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#141414]/20 z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#141414] z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />

          {[1, 2, 3].map((s) => (
            <div key={s} className="z-10 flex flex-col items-center">
              <div 
                className={`w-9 h-9 flex items-center justify-center border font-mono text-xs transition-all ${
                  step > s 
                    ? 'bg-green border-green-700 text-white' 
                    : step === s 
                    ? 'bg-[#141414] border-[#141414] text-white font-bold'
                    : 'bg-[#EEECE8] border-[#141414]/30 text-slate-500'
                }`}
              >
                {step > s ? <Check className="w-4 h-4 text-white" /> : s}
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold mt-2 ${step === s ? 'text-[#141414]' : 'text-slate-500'}`}>
                {s === 1 ? 'Limits' : s === 2 ? 'Protocols' : 'Deploy'}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic Wizard Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue" />
                  Step 1: On-chain Safety Limits
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Define spending constraints. These guardrails are locked inside the vault smart contract code.
                </p>
              </div>

              {/* Slider Controls */}
              <div className="space-y-6 mt-8">
                <div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <span>Per-Transaction Limit</span>
                    <span className="text-blue font-mono tabular-nums">${perTxMax} USD</span>
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>$50</span>
                    <span>$5,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <span>Daily Spending Cap</span>
                    <span className="text-blue font-mono tabular-nums">${dailyCap} USD</span>
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>$100</span>
                    <span>$20,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <span>Human Co-Sign Threshold</span>
                    <span className="text-blue font-mono tabular-nums">${coSignThreshold} USD</span>
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>$0 (Always co-sign)</span>
                    <span>$10,000</span>
                  </div>
                </div>
              </div>

              {/* Natural English Statement Card */}
              <div className="mt-8 p-4 rounded-lg bg-navy/60 border border-border flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Your agent is authorized to automatically rebalance up to <strong className="text-white">${perTxMax}</strong> per transaction, with an immutable limit of <strong className="text-white">${dailyCap}</strong> total per day. Any re-allocation transaction size above <strong className="text-white">${coSignThreshold}</strong> requires manual human co-signing before final execution.
                </p>
              </div>

              {/* Next Step Control */}
              <div className="mt-8 flex justify-end text-white">
                <button
                  onClick={() => setStep(2)}
                  className="bg-[#141414] hover:bg-[#2B2B2B] px-5 h-10 text-white hover:text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2 transform active:scale-95 transition-all cursor-pointer border border-[#141414] transition-colors"
                >
                  Configure Protocols
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue" />
                  Step 2: Whitelist Protocols
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Enforce strict protocol restrictions. The agent cannot interact with any un-checked platform.
                </p>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                {protocolsList.map((proto) => {
                  const isChecked = selectedProtocols.includes(proto.name);
                  return (
                    <div
                      key={proto.name}
                      onClick={() => handleToggleProtocol(proto.name)}
                      className={`p-4 border text-left cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-[#141414] bg-[#EEECE8]' 
                          : 'border-[#141414]/20 bg-surface opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-[#141414]">{proto.name}</span>
                        <div className={`w-4 h-4 border flex items-center justify-center ${
                          isChecked ? 'bg-[#141414] border-[#141414] text-white' : 'border-[#141414]/30 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">{proto.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Control buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="border border-[#141414] hover:bg-[#EEECE8] text-[#141414] px-5 h-10 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (selectedProtocols.length === 0) {
                      toast('error', 'Select at least one protocol to whitelist.');
                      return;
                    }
                    setStep(3);
                  }}
                  className="bg-[#141414] hover:bg-[#2B2B2B] px-5 h-10 text-white hover:text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2 transform active:scale-95 transition-all cursor-pointer border border-[#141414] transition-colors"
                >
                  Verify deployment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-blue" />
                  Step 3: Deploy & Fund Vault
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Deploy contract locks to 0G Chain. Transactions will run in the sandbox environment.
                </p>
              </div>

              {/* Onboarding Deploy Status Screen */}
              {isDeploying ? (
                <div className="my-12 flex flex-col items-center py-6">
                  <Loader2 className="w-10 h-10 text-blue animate-spin mb-6" />
                  <div className="h-6">
                    <motion.p 
                      key={deployStepIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-slate-300 font-mono text-center tracking-wide"
                    >
                      {deployMessages[deployStepIndex]}
                    </motion.p>
                  </div>
                  <div className="w-48 bg-border h-1.5 rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((deployStepIndex + 1) / deployMessages.length) * 100}%` }}
                      transition={{ duration: 1.2 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 mt-8">
                  {/* Summary Card */}
                  <div className="border border-border p-5 space-y-3 bg-[#EEECE8]">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] border-b border-[#141414]/20 pb-2">
                      Vault Configuration Matrix
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500">Per-Tx Limit:</span>
                        <p className="text-[#141414] font-semibold">${perTxMax}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Daily Max Cap:</span>
                        <p className="text-[#141414] font-semibold">${dailyCap}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Approve Threshold:</span>
                        <p className="text-[#141414] font-semibold">${coSignThreshold}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Whitelisted Pools:</span>
                        <p className="text-[#141414] font-semibold truncate">
                          {selectedProtocols.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fund Sandbox Vault Callout */}
                  <div className="p-4 bg-[#EEECE8] border-l-4 border-l-[#141414] border-y border-r border-[#141414]">
                    <h4 className="text-xs font-semibold text-[#141414] mb-1">Simulate Gas Funding</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This sandbox provides a simulated $25,000 portfolio locked inside the smart contract, with onchain gas fees paid automatically from the 0G Chain testnet faucet.
                    </p>
                  </div>

                  {/* Deploy Vault Button */}
                  <button
                    onClick={handleStartDeploy}
                    className="w-full h-11 bg-green-700 hover:bg-green-800 text-white hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer border border-[#141414]"
                  >
                    Deploy Vault Contract & Fund
                  </button>

                  <div className="flex justify-between mt-8 border-t border-[#141414] pt-4">
                    <button
                      onClick={() => setStep(2)}
                      className="border border-[#141414] hover:bg-[#EEECE8] text-[#141414] px-5 h-10 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
