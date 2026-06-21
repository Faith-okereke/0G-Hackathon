import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, Cpu, Database, Wallet, Search, RefreshCw, Key, LogOut, Terminal, Keyboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { ConnectScreen } from './components/ConnectScreen';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Dashboard } from './components/Dashboard';
import { DecisionLogPage } from './components/DecisionLogPage';
import { SettingsPage } from './components/SettingsPage';
import { AegisLogo } from './components/AegisLogo';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DeFiPosition, DecisionLog, PerformancePoint, VaultLimits } from './types';

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return localStorage.getItem('aegis_zero_wallet_address') || localStorage.getItem('defai_wallet_address');
  });
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Core system states
  const [vaultDeployed, setVaultDeployed] = useState(false);
  const [vaultAddress, setVaultAddress] = useState('');
  const [activeAgentKey, setActiveAgentKey] = useState('0x7F...d49a');
  const [isPaused, setIsPaused] = useState(false);
  const [limits, setLimits] = useState<VaultLimits>({ perTxMax: 500, dailyCap: 2000, coSignThreshold: 1000, cooldownPeriod: 900 });
  const [whitelistedProtocols, setWhitelistedProtocols] = useState<string[]>([]);
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);
  const [chartPoints, setChartPoints] = useState<PerformancePoint[]>([]);

  // Interactive UI states
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isTriggeringCycle, setIsTriggeringCycle] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

  // Toast Helper
  const triggerToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch full state from server
  const fetchState = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/agent-state');
      const data = await res.json();
      setVaultDeployed(data.vaultDeployed);
      setVaultAddress(data.vaultAddress);
      setActiveAgentKey(data.activeAgentKey);
      setIsPaused(data.isPaused);
      setLimits(data.limits);
      setWhitelistedProtocols(data.whitelistedProtocols);
      setPositions(data.positions);
      setDecisionLogs(data.decisionLogs);
      setChartPoints(data.chartPoints);
    } catch (e) {
      triggerToast('error', 'Error syncing state with 0G network.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Hotkeys and command palette triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Cmd+K Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        setPaletteSearch('');
      }

      // Quick tabs
      if (currentTab !== 'dashboard' && e.key.toLowerCase() === 'd') {
        setCurrentTab('dashboard');
        triggerToast('info', 'Switched to Dashboard view.');
      }
      if (e.key.toLowerCase() === 'l') {
        setCurrentTab('logs');
        triggerToast('info', 'Switched to Decision Logs.');
      }
      if (e.key.toLowerCase() === 's') {
        setCurrentTab('settings');
        triggerToast('info', 'Switched to Security Options.');
      }
      if (e.key.toLowerCase() === 'p') {
        handlePauseToggle(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, isPaused]);

  // Connect helper
  const handleConnectWallet = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem('aegis_zero_wallet_address', address);
    triggerToast('success', 'Hardware wallet connected via cryptographically proof.');
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem('aegis_zero_wallet_address');
    localStorage.removeItem('defai_wallet_address');
    triggerToast('info', 'Wallet session terminated safely.');
  };

  // Onboarding completion helper
  const handleOnboardingComplete = (onboardData: any) => {
    setVaultDeployed(true);
    setVaultAddress(onboardData.vaultAddress);
    setLimits(onboardData.limits || limits);
    setWhitelistedProtocols(onboardData.whitelistedProtocols || whitelistedProtocols);
    fetchState();
  };

  // Pause toggle
  const handlePauseToggle = async (paused: boolean) => {
    try {
      const res = await fetch('/api/emergency-pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaused(data.isPaused);
        triggerToast(
          data.isPaused ? 'error' : 'success',
          data.isPaused 
            ? 'Emergency Interruption enabled. Smart vault frozen.' 
            : 'Agent resumed. Reactivated consensus tick ranges.'
        );
      }
    } catch (e) {
      triggerToast('error', 'Key validation error on smart vault.');
    }
  };

  // Modify limits
  const handleUpdateLimits = async (newLimits: VaultLimits) => {
    try {
      const res = await fetch('/api/update-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLimits),
      });
      const data = await res.json();
      if (data.success) {
        setLimits(data.limits);
        triggerToast('success', 'On-chain spending limits updated successfully.');
      }
    } catch (e) {
      triggerToast('error', 'Error broadcasting limits tx.');
    }
  };

  // Modify Protocols
  const handleUpdateProtocols = async (pList: string[]) => {
    try {
      const res = await fetch('/api/update-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocols: pList }),
      });
      const data = await res.json();
      if (data.success) {
        setWhitelistedProtocols(data.whitelistedProtocols);
        triggerToast('success', 'Contracts whitelist edited on 0G storage.');
      }
    } catch (e) {
      triggerToast('error', 'Network failure updating contract lists.');
    }
  };

  // Key rotation
  const handleRotateKey = async () => {
    try {
      const res = await fetch('/api/rotate-key', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActiveAgentKey(data.activeAgentKey);
        triggerToast('success', 'Delegated Session Key generation validated.');
      }
    } catch (e) {
      triggerToast('error', 'Consensus mismatch during rotation.');
    }
  };

  // Empty funds simulation
  const handleWithdrawFunds = async () => {
    try {
      const res = await fetch('/api/withdraw', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPositions(data.positions);
        triggerToast('success', 'Vault swept! $0 USD active locks.');
      }
    } catch (e) {
      triggerToast('error', 'Error sweeping liquidity layers.');
    }
  };

  const handleAddmockFunds = async (amount: number) => {
    try {
      const res = await fetch('/api/add-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setPositions(data.positions);
        triggerToast('success', `Simulated faucet funded $${amount.toLocaleString()} into your vault.`);
      }
    } catch (e) {
      triggerToast('error', 'Faucet error. Try again latter.');
    }
  };

  // Programmatic manual check rebalancing trigger
  const handleTriggerRebalanceCycle = async () => {
    if (isPaused) {
      triggerToast('error', 'Cannot run automated ticks while paused.');
      return;
    }

    setIsTriggeringCycle(true);
    triggerToast('info', '0G Compute requesting LLM volatility analysis...');

    try {
      const res = await fetch('/api/run-cycle', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPositions(data.positions);
        
        // Put newest log first
        setDecisionLogs((prev) => [data.newAction, ...prev]);
        
        if (data.newAction.action === 'REBALANCE') {
          triggerToast('success', `A rebalance action was executed on ${data.newAction.protocol} for $${data.newAction.amount}.`);
        } else {
          triggerToast('info', 'Consensus tick analyzed. Vault values are safe. Hold.');
        }
        
        // Reload points for chart
        fetchState(true);
      }
    } catch (e) {
      triggerToast('error', 'Compute error during consensus tick.');
    } finally {
      setIsTriggeringCycle(false);
    }
  };

  // Command palette filter options
  const commandPaletteItems = [
    { title: 'Pause Agent Session', action: () => handlePauseToggle(!isPaused), icon: '⏸️' },
    { title: 'Re-sync with 0G Chain', action: () => fetchState(), icon: '🔄' },
    { title: 'Jump to Decision Logs', action: () => setCurrentTab('logs'), icon: '📝' },
    { title: 'Jump to Security Settings', action: () => setCurrentTab('settings'), icon: '⚙️' },
    { title: 'Fund Simulation Wallet', action: () => handleAddmockFunds(5000), icon: '💵' },
  ];

  const filteredPaletteItems = commandPaletteItems.filter((item) =>
    item.title.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  // Return connected state
  if (!walletAddress) {
    return (
      <>
        <ConnectScreen onConnect={handleConnectWallet} />
        <ToastContainer toasts={toasts} onClose={handleCloseToast} />
      </>
    );
  }

  // Return onboarding state
  if (walletAddress && !vaultDeployed) {
    return (
      <>
        <OnboardingWizard onComplete={handleOnboardingComplete} toast={triggerToast} />
        <ToastContainer toasts={toasts} onClose={handleCloseToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-slate-100 font-sans flex flex-col">
      {/* Top Navbar Menu Shell */}
      <header className="min-h-[4rem] border-b border-border bg-navy/80 backdrop-blur sticky top-0 z-40 px-4 py-3 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all">
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-4 md:gap-6">
          {/* Logo Name */}
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-9 h-9 flex items-center justify-center filter drop-shadow">
              <AegisLogo size={36} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif italic text-sm sm:text-[15px] font-semibold text-[#141414] leading-none mb-0.5">Ægis Zero</span>
              <span className="text-[9px] font-mono text-[#141414]/60 tracking-wider uppercase leading-none">0G Secure Smart Vault</span>
            </div>
          </div>

          {/* Navigation Matrix Tabs */}
          <nav className="flex items-center gap-1">
            <button
               onClick={() => setCurrentTab('dashboard')}
               className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                 currentTab === 'dashboard' ? 'bg-[#141414] text-white' : 'text-[#141414]/60 hover:text-[#141414]'
               }`}
            >
              Dashboard
            </button>
            <button
               onClick={() => setCurrentTab('logs')}
               className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                 currentTab === 'logs' ? 'bg-[#141414] text-white' : 'text-[#141414]/60 hover:text-[#141414]'
               }`}
            >
              Audits Log
            </button>
            <button
               onClick={() => setCurrentTab('settings')}
               className={`h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                 currentTab === 'settings' ? 'bg-[#141414] text-white' : 'text-[#141414]/60 hover:text-[#141414]'
               }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
          
          {/* Real-time Status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-surface border border-border">
            {isPaused ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red bg-red-500" />
                <span className="text-[9px] uppercase font-bold text-slate-400">PAUSED</span>
              </>
            ) : isTriggeringCycle ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber bg-amber-500 animate-pulse" />
                <span className="text-[9px] uppercase font-bold text-amber-500">Vol Analysing</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green bg-green-500 pulse-green" />
                <span className="text-[9px] uppercase font-bold text-green-400">Agent Live</span>
              </>
            )}
          </div>

          {/* Connected Address info block */}
          <div className="flex items-center gap-2">
            <div className="font-mono text-[11px] sm:text-xs text-slate-400 px-2 sm:px-2.5 py-1 bg-surface border border-border rounded flex items-center gap-1.5">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue flex-shrink-0" />
              <span className="sm:hidden">{walletAddress.length > 13 ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : walletAddress}</span>
              <span className="hidden sm:inline">{walletAddress}</span>
            </div>

            <button
              onClick={handleDisconnectWallet}
              className="p-1.5 rounded hover:bg-surface text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 transition-all duration-300">
        
        {/* Loading Skeleton fallback block */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-surface/40 animate-pulse border border-border rounded-xl p-5 space-y-3">
                  <div className="h-3 bg-slate-700 w-1/2 rounded" />
                  <div className="h-6 bg-slate-700 w-3/4 rounded" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-80 bg-surface/40 animate-pulse border border-border rounded-xl" />
              <div className="h-80 bg-surface/40 animate-pulse border border-border rounded-xl" />
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <Dashboard
                  positions={positions}
                  decisionLogs={decisionLogs}
                  chartData={chartPoints}
                  isPaused={isPaused}
                  limits={limits}
                  activeAgentKey={activeAgentKey}
                  vaultAddress={vaultAddress}
                  walletAddress={walletAddress}
                  onPauseToggle={handlePauseToggle}
                  onTriggerRebalanceCycle={handleTriggerRebalanceCycle}
                  onNavigateToLogs={() => setCurrentTab('logs')}
                  onNavigateToSettings={() => setCurrentTab('settings')}
                  onAddFunds={handleAddmockFunds}
                  isTriggeringCycle={isTriggeringCycle}
                />
              </motion.div>
            )}

            {currentTab === 'logs' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <DecisionLogPage
                  decisionLogs={decisionLogs}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                  toast={triggerToast}
                />
              </motion.div>
            )}

            {currentTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.15 }}
              >
                <SettingsPage
                  limits={limits}
                  whitelistedProtocols={whitelistedProtocols}
                  activeAgentKey={activeAgentKey}
                  isPaused={isPaused}
                  vaultAddress={vaultAddress}
                  onUpdateLimits={handleUpdateLimits}
                  onUpdateProtocols={handleUpdateProtocols}
                  onRotateKey={handleRotateKey}
                  onPauseToggle={handlePauseToggle}
                  onWithdrawFunds={handleWithdrawFunds}
                  toast={triggerToast}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer Navigation Bar for small viewport controls */}
      <footer className="md:hidden border-t border-border bg-surface p-2 fixed bottom-0 left-0 right-0 z-40 flex justify-around">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center p-1 text-[10px] font-bold tracking-tight uppercase ${
            currentTab === 'dashboard' ? 'text-blue' : 'text-slate-400'
          }`}
        >
          <Terminal className="w-4 h-4 mb-0.5" />
          Dash
        </button>
        <button
          onClick={() => setCurrentTab('logs')}
          className={`flex flex-col items-center p-1 text-[10px] font-bold tracking-tight uppercase ${
            currentTab === 'logs' ? 'text-blue' : 'text-slate-400'
          }`}
        >
          <Database className="w-4 h-4 mb-0.5" />
          Audits
        </button>
        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center p-1 text-[10px] font-bold tracking-tight uppercase ${
            currentTab === 'settings' ? 'text-blue' : 'text-slate-400'
          }`}
        >
          <Cpu className="w-4 h-4 mb-0.5" />
          Settings
        </button>
      </footer>

      {/* Floating Keyboard shortcut info drawer */}
      <div className="fixed bottom-6 left-6 z-30 hidden lg:flex items-center gap-1.5 p-2 bg-surface/60 border border-border rounded text-[10px] text-slate-400 font-mono">
        <Keyboard className="w-3.5 h-3.5 text-blue" />
        <span>[D] Dash • [L] Logs • [S] Settings • [P] Pause • [Cmd+K] Console</span>
      </div>

      {/* Interactive Command Palette Modal (Cmd+K) */}
      <AnimatePresence>
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-8 pt-24 bg-navy/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-surface border border-border rounded-xl overflow-hidden max-w-lg w-full text-left font-sans shadow-2xl"
            >
              <div className="p-4 border-b border-border flex items-center pr-3">
                <Search className="w-4 h-4 text-slate-500 mr-3" />
                <input
                  type="text"
                  placeholder="Commands palette search..."
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder-slate-500"
                  autoFocus
                />
                <kbd className="px-2 py-0.5 bg-navy border border-border text-[9px] text-slate-400 rounded">ESC</kbd>
              </div>

              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {filteredPaletteItems.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center font-mono">No command actions match.</p>
                ) : (
                  filteredPaletteItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.action();
                        setShowCommandPalette(false);
                      }}
                      className="w-full text-left px-3 h-10 text-xs font-mono text-[#141414] hover:bg-[#EEECE8] flex items-center gap-3 transition-all cursor-pointer border-b border-[#141414]/10"
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.title}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Toasts component */}
      <ToastContainer toasts={toasts} onClose={handleCloseToast} />
    </div>
  );
}
