import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, Wallet, ArrowRight, X, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AegisLogo } from './AegisLogo';

interface ConnectScreenProps {
  onConnect: (walletAddress: string) => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      setHasMetaMask(true);
    }
  }, []);

  const handleConnectSimulated = (address: string) => {
    setIsConnecting(true);
    setErrorMessage('');
    setTimeout(() => {
      onConnect(address);
      setIsConnecting(false);
      setShowWalletModal(false);
    }, 1000);
  };

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    
    // Check if MetaMask is available in the current browser context (even inside an iframe)
    const provider = (window as any).ethereum;
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          onConnect(accounts[0]);
          setIsConnecting(false);
          setShowWalletModal(false);
          return;
        }
      } catch (err: any) {
        console.error("MetaMask connection failed", err);
        setErrorMessage(err.message || "MetaMask connection was rejected or failed inside the secure sandbox.");
      }
    } else {
      // In sandbox/iframe environment, standard extension might not bind
      setErrorMessage("MetaMask is not injected in this frame. Please paste your address manually or use simulated account.");
    }
    setIsConnecting(false);
  };

  const handleCustomAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!customAddress.startsWith('0x') || customAddress.length !== 42) {
      setErrorMessage("Please enter a valid Ethereum hex address (must start with 0x and be 42 characters).");
      return;
    }
    handleConnectSimulated(customAddress);
  };

  const handleEasyInput = (addr: string) => {
    setCustomAddress(addr);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background grid details representing high density space */}
      <div className="absolute inset-0 bg-[#E4E3E0] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(#141414 1px, transparent 1px)`,
          backgroundSize: '16px 16px'
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-[460px] w-full bg-[#D9D8D5] border border-[#141414] shadow-none relative z-10"
      >
        {/* Card Header */}
        <div className="px-6 py-4 border-b border-[#141414] bg-[#EEECE8] flex items-center justify-between">
          <div className="flex items-center gap-3 select-none group">
            <div className="w-8 h-8 flex items-center justify-center">
              <AegisLogo size={32} />
            </div>
            <span className="font-serif italic text-sm font-semibold tracking-tight text-[#141414]">Ægis Zero Link</span>
          </div>
          <span className="text-[9px] font-mono bg-[#141414] text-[#ffffff] px-2 py-0.5 tracking-wider uppercase">V1.0.0</span>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Display Shield (Brand Logo) */}
            <div className="w-20 h-20 mb-4 flex items-center justify-center filter drop-shadow-md">
              <AegisLogo size={80} />
            </div>

            <h1 className="text-xl font-mono uppercase font-bold text-[#141414] tracking-tight mb-2">
              Ægis Zero Vault
            </h1>
            <p className="text-[#141414] text-xs font-mono opacity-80 mb-6 leading-relaxed max-w-sm">
              Secure, AI-powered DeFi vault that automatically manages portfolio allocations across multiple protocols.
            </p>

            {/* Simulated Wallet Button */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full h-10 bg-[#141414] hover:bg-[#2B2B2B] text-white hover:text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-white" />
              Secure Connect Wallet
            </button>

            {/* Trust Matrix */}
            <div className="w-full mt-6 border-t border-[#141414] pt-4 flex flex-col gap-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#141414]">Non-custodial structural vault</h4>
                  <p className="text-[11px] text-[#141414]/70">Standardized smart vault contract guarantees only you possess execution key control.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Cpu className="w-4 h-4 text-[#141414] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#141414]">Signed performance hashes</h4>
                  <p className="text-[11px] text-[#141414]/70">Rebalance actions secure valid cryptographic proofs archived directly on 0G Storage nodes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Database className="w-4 h-4 text-[#141414] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-[#141414]">Fully automated liquidity cycles</h4>
                  <p className="text-[11px] text-[#141414]/70">Let AI analyze protocol drift ranges asynchronously or evaluate manually.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Wallet Selection & Custom Address Paste Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#141414]/30 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/40 backdrop-blur-xl border-2 border-[#141414] max-w-md w-full shadow-[8px_8px_0px_0px_#141414] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b-2 border-[#141414] bg-[#EEECE8]/50 backdrop-blur-md flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">Select Web3 Wallet Provider</span>
                <button 
                  onClick={() => {
                    setShowWalletModal(false);
                    setErrorMessage('');
                  }}
                  className="p-1 hover:bg-[#141414]/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-[#141414]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-100 border border-red-500 text-red-700 text-xs font-mono">
                    {errorMessage}
                  </div>
                )}

                {/* Primary Wallets */}
                <div className="space-y-2">
                  <button
                    onClick={handleMetaMaskConnect}
                    disabled={isConnecting}
                    className="w-full h-11 bg-[#141414] hover:bg-[#2B2B2B] active:scale-[0.99] border border-[#141414] disabled:opacity-50 disabled:pointer-events-none px-4 text-left flex items-center justify-between group transition-all text-xs font-mono text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex-shrink-0 bg-orange-100 border border-orange-300 flex items-center justify-center font-bold text-xs rounded">🦊</div>
                      <span className="font-bold">Metamask Extension</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasMetaMask && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 font-sans font-bold uppercase tracking-wide">Detected</span>}
                      <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <button
                    onClick={() => handleConnectSimulated("0x71C7656EC7ab88b098defB751B7401B5f6d1476B")}
                    disabled={isConnecting}
                    className="w-full h-11 bg-[#141414] hover:bg-[#2B2B2B] active:scale-[0.99] border border-[#141414] disabled:opacity-50 disabled:pointer-events-none px-4 text-left flex items-center justify-between group transition-all text-xs font-mono text-white cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 flex-shrink-0 bg-blue-100 border border-blue-300 flex items-center justify-center font-bold text-xs rounded">🛡️</div>
                      <span className="font-bold">Simulated 0G Ledger Wallet</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Custom Address Input Form */}
                <div className="border-t border-[#141414] pt-4">
                  <h3 className="text-[10px] font-mono uppercase font-bold text-[#141414] mb-2 tracking-wider">
                    Or input custom Evm Wallet / ENS Address
                  </h3>
                  <form onSubmit={handleCustomAddressSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="0x... or vitalik.eth"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        disabled={isConnecting}
                        className="flex-1 text-xs font-mono h-10 px-3 border border-[#141414] bg-white text-[#141414] placeholder-[#141414]/50 outline-none focus:ring-1 focus:ring-[#141414]"
                      />
                      <button
                        type="submit"
                        disabled={isConnecting || !customAddress}
                        className="px-4 h-10 bg-[#141414] hover:bg-[#2B2B2B] disabled:bg-[#141414]/15 disabled:text-[#141414]/40 disabled:border-[#141414]/10 disabled:cursor-not-allowed border border-[#141414] text-white hover:text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center cursor-pointer transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    {/* Pre-set Easy addresses to quickly test */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[9px] font-mono text-[#141414]/60 mr-1 self-center">Sandbox templates:</span>
                      <button
                        type="button"
                        onClick={() => handleEasyInput("0x9cE41Ac5718aEA6EBA1b88e0797435f3b79da93C")}
                        className="text-[9px] font-mono px-2 py-0.5 border border-[#141414]/30 hover:border-[#141414] hover:bg-[#EEECE8] bg-[#EEECE8] text-[#141414] font-bold text-left cursor-pointer transition-colors"
                      >
                        0x9cE4...a93C
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEasyInput("0xF1A51197ea8aEB098defB51B5d1A00CAbA1A76Bd")}
                        className="text-[9px] font-mono px-2 py-0.5 border border-[#141414]/30 hover:border-[#141414] hover:bg-[#EEECE8] bg-[#EEECE8] text-[#141414] font-bold text-left cursor-pointer transition-colors"
                      >
                        0xF1A5...76Bd
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Aesthetic Footer Credit */}
      <div className="mt-12 text-[#141414] opacity-50 text-[10px] flex items-center gap-1.5 z-10 font-mono">
        <span className="w-2 h-2 rounded-full bg-green bg-green-500" />
        0G CHAIN TESTNET READY
      </div>
    </div>
  );
};

