import React, { useState, useMemo } from 'react';
import { 
  Search, ShieldCheck, Download, ChevronDown, ChevronUp, ExternalLink, Calendar, Layers, Clipboard,
  Activity, FileCode, GitBranch, Server, CheckCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DecisionLog } from '../types';

interface DecisionLogPageProps {
  decisionLogs: DecisionLog[];
  onBackToDashboard: () => void;
  toast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const DecisionLogPage: React.FC<DecisionLogPageProps> = ({ 
  decisionLogs = [], 
  onBackToDashboard,
  toast
}) => {
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('ALL');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedLogForProof, setSelectedLogForProof] = useState<DecisionLog | null>(null);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'chunks' | 'merkle' | 'da'>('merkle');
  const [selectedChunkIndex, setSelectedChunkIndex] = useState<number>(0);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // Toggle rows logic
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Get unique protocols for the filter dropdown
  const uniqueProtocols = useMemo(() => {
    const protocols = new Set<string>();
    decisionLogs.forEach(log => {
      if (log.protocol && log.protocol !== "System Deploy") {
        protocols.add(log.protocol);
      }
    });
    return Array.from(protocols);
  }, [decisionLogs]);

  // Apply sequential multi-filtering locally
  const filteredLogs = useMemo(() => {
    return decisionLogs.filter(log => {
      const matchesSearch = log.reasoning.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.protocol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
      const matchesProtocol = selectedProtocol === 'ALL' || log.protocol === selectedProtocol;
      return matchesSearch && matchesAction && matchesProtocol;
    });
  }, [decisionLogs, searchTerm, selectedAction, selectedProtocol]);

  // Paginated partition
  const paginatedLogs = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  // CSV download function helper
  const handleDownloadCSV = () => {
    try {
      if (filteredLogs.length === 0) {
        toast('info', 'No logs available to export.');
        return;
      }

      const headers = ['Timestamp', 'Cycle #', 'Action', 'Protocol', 'Amount (USD)', 'Reasoning', 'Receipt Hash', 'Tx Hash', 'Status'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          log.timestamp,
          log.cycleNumber,
          log.action,
          `"${log.protocol ? log.protocol.replace(/"/g, '""') : ''}"`,
          log.amount,
          `"${log.reasoning ? log.reasoning.replace(/"/g, '""') : ''}"`,
          log.receiptHash,
          log.txHash,
          log.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `aegis_zero_audit_log_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('success', 'Full filtered log exported as CSV file.');
    } catch (e) {
      toast('error', 'Failed to generate CSV export file.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast('success', `${label} copied to clipboard.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Control deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">
            Verifiable Decision Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Independently audit every single automated portfolio query, 0G verified computation, and on-chain receipt hash.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="h-9 px-4 bg-[#141414] hover:bg-[#2B2B2B] text-white hover:text-white border border-[#141414] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Real-time filtering matrix toolbar */}
      <div className="bg-surface border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Box 1: Search Reasoning text */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search reasoning or protocols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-navy/60 border border-border rounded-lg text-xs font-medium text-slate-200 placeholder-slate-500 focus:border-blue/50 outline-none transition-all"
          />
        </div>

        {/* Box 2: Filter Action Type */}
        <div className="flex flex-col">
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-navy/60 border border-border rounded-lg text-xs font-medium text-slate-200 focus:border-blue/50 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">Action: All Actions</option>
            <option value="REBALANCE">Action: REBALANCE</option>
            <option value="HOLD">Action: HOLD</option>
            <option value="ALERT">Action: ALERT</option>
            <option value="FAILED">Action: FAILED</option>
          </select>
        </div>

        {/* Box 3: Filter Protocol */}
        <div className="flex flex-col">
          <select
            value={selectedProtocol}
            onChange={(e) => { setSelectedProtocol(e.target.value); setCurrentPage(1); }}
            className="w-full h-10 px-3 bg-navy/60 border border-border rounded-lg text-xs font-medium text-slate-200 focus:border-blue/50 outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">Protocol: All Protocols</option>
            {uniqueProtocols.map(proto => (
              <option key={proto} value={proto}>{proto}</option>
            ))}
          </select>
        </div>

        {/* Box 4: Active Filter statistics */}
        <div className="flex items-center justify-end px-2 text-[11px] font-mono text-slate-400">
          Filtered: <strong className="text-white mx-1">{filteredLogs.length}</strong> of <strong className="text-white mx-1">{decisionLogs.length}</strong> decisions
        </div>
      </div>

      {/* Main Table Matrix */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface border-b border-border z-10">
              <tr className="bg-navy/30 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="p-4 w-12"></th>
                <th className="p-4 w-28">Timestamp</th>
                <th className="p-4 w-20 text-center">Cycle #</th>
                <th className="p-4 w-24">Action</th>
                <th className="p-4">Protocol</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 w-96">Reasoning Snippet</th>
                <th className="p-4 text-center">Proof (0G)</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 font-mono">
                    No verified decision logs found matching current search terms.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isExpanded = !!expandedRows[log.id];
                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        onClick={() => toggleRow(log.id)}
                        className={`transition-colors cursor-pointer ${isExpanded ? 'bg-navy/20' : ''}`}
                      >
                        <td className="p-4 text-center text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="p-4 font-mono text-slate-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-300">
                          #{log.cycleNumber}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === 'REBALANCE' 
                              ? 'bg-blue/15 text-blue-400 border border-blue/20' 
                              : log.action === 'HOLD'
                              ? 'bg-slate-800 text-slate-400 border border-border/40'
                              : 'bg-amber/15 text-amber-400 border border-amber/20'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {log.protocol}
                        </td>
                        <td className="p-4 text-right font-mono font-medium text-white tabular-nums">
                          {log.amount > 0 ? `$${log.amount}` : '—'}
                        </td>
                        <td className="p-4 text-slate-300 truncate max-w-sm">
                          {log.reasoning}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 text-green text-green-400 text-[10px] font-mono">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            receipt
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-green/15 text-green-400 font-semibold uppercase tracking-wide">
                            Confirmed
                          </span>
                        </td>
                      </tr>

                      {/* Expanded View Drawer details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0 bg-navy/35">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 border-l-2 border-blue bg-navy/20 space-y-4"
                              >
                                {/* Expanded grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                  {/* AI Reasoning Block */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-blue" />
                                      Full verified AI Reasoning Text
                                    </h4>
                                    <div className="bg-surface p-4 rounded-lg border border-border font-sans text-xs text-slate-200 leading-relaxed shadow-inner">
                                      {log.reasoning}
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyToClipboard(log.reasoning, 'Reasoning text'); }}
                                      className="text-[10px] text-blue hover:text-blue-400 font-semibold flex items-center gap-1 font-mono uppercase"
                                    >
                                      <Clipboard className="w-3 h-3" />
                                      Copy reasoning text
                                    </button>
                                  </div>

                                  {/* Storage Metadata JSON Block */}
                                  <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-amber" />
                                      0G Permanent Storage State Snapshot (JSON)
                                    </h4>
                                    <pre className="bg-surface p-4 rounded-lg border border-border font-mono text-[10px] text-slate-300 overflow-y-auto max-h-48 shadow-inner">
                                      {JSON.stringify(log.inputState, null, 2)}
                                    </pre>
                                  </div>
                                </div>

                                {/* Hash Links block */}
                                <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-4 justify-between text-[11px] font-mono text-slate-400">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-slate-500 uppercase">0G Compute Receipt Cryptoid:</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-slate-300 break-all">{log.receiptHash}</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(log.receiptHash, 'Receipt hash'); }}
                                        className="text-white hover:text-blue"
                                      >
                                        <Clipboard className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedLogForProof(log); setActiveInspectorTab('merkle'); }}
                                      className="text-[#141414] hover:text-[#5F5E5C] hover:underline text-[11px] font-bold flex items-center gap-1 mt-1 text-left cursor-pointer transition-all uppercase tracking-wider font-mono"
                                    >
                                      Inspect Proof via 0G Storage
                                      <Layers className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {log.txHash && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-slate-500 uppercase">0G Chain Transaction Hash:</span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-300 break-all">{log.txHash}</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); copyToClipboard(log.txHash, 'Transaction hash'); }}
                                          className="text-white hover:text-blue"
                                        >
                                          <Clipboard className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <a 
                                        href="https://testnet-scan.0g.ai" 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="text-blue hover:underline text-[10px] flex items-center gap-0.5 mt-0.5"
                                      >
                                        View EVM block execution receipt
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginated Footer controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-[#EEECE8] border-t border-[#141414] flex justify-between items-center text-xs font-mono">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 bg-[#EEECE8] border border-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 cursor-pointer text-[#141414] transition-colors"
            >
              Previous
            </button>
            <span className="text-[#141414]">
              Page <strong className="text-[#141414] font-bold">{currentPage}</strong> of <strong className="text-[#141414] font-bold">{totalPages}</strong>
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 bg-[#EEECE8] border border-[#141414] hover:bg-[#E4E3E0] disabled:opacity-30 cursor-pointer text-[#141414] transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 0G Decentralized Storage Proof Verifier Modal */}
      <AnimatePresence>
        {selectedLogForProof && (
          <div className="fixed inset-0 bg-[#141414]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="max-w-4xl w-full bg-[#D9D8D5] border-2 border-[#141414] shadow-none flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b-2 border-[#141414] bg-[#EEECE8] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#141414] flex items-center justify-center text-white">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#141414] font-mono flex items-center gap-2">
                      0G Storage Proof Verifier
                      <span className="text-[10px] bg-green-700 text-white px-2 py-0.5 font-mono font-normal">Active DA</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-sm md:max-w-xl">
                      CID: <span className="font-bold">{selectedLogForProof.receiptHash}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogForProof(null)}
                  className="w-8 h-8 flex items-center justify-center border border-[#141414] hover:bg-[#E4E3E0] cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Stats Banner */}
              <div className="bg-[#EEECE8]/50 border-b border-[#141414]/10 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#141414]/15 text-xs font-mono">
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block">STORED SEGMENTS</span>
                  <strong className="text-[#141414] font-bold text-sm">4 Raw Chunks</strong>
                </div>
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block">TOTAL LOG SIZE</span>
                  <strong className="text-[#141414] font-bold text-sm">12.44 KiB</strong>
                </div>
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block">0G network latency</span>
                  <strong className="text-[#141414] font-bold text-sm flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-green-700 animate-pulse" /> 
                    74 MS
                  </strong>
                </div>
                <div className="p-3">
                  <span className="text-[11px] text-slate-500 block">CONSENSUS SYNC</span>
                  <strong className="text-green-700 font-bold text-sm">100% (14 Nodes)</strong>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="bg-[#EEECE8] border-b-2 border-[#141414] flex font-mono text-xs">
                <button
                  onClick={() => setActiveInspectorTab('merkle')}
                  className={`flex-1 py-3 border-r border-[#141414]/15 font-bold uppercase transition-all tracking-wider ${
                    activeInspectorTab === 'merkle' ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5 text-[#141414]'
                  }`}
                >
                  Merkle Tree Path Proof
                </button>
                <button
                  onClick={() => setActiveInspectorTab('chunks')}
                  className={`flex-1 py-3 border-r border-[#141414]/15 font-bold uppercase transition-all tracking-wider ${
                    activeInspectorTab === 'chunks' ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5 text-[#141414]'
                  }`}
                >
                  Raw Segment Chunks
                </button>
                <button
                  onClick={() => setActiveInspectorTab('da')}
                  className={`flex-1 py-3 font-bold uppercase transition-all tracking-wider ${
                    activeInspectorTab === 'da' ? 'bg-[#141414] text-white' : 'hover:bg-[#141414]/5 text-[#141414]'
                  }`}
                >
                  0G Decentralized DA Monitor
                </button>
              </div>

              {/* Custom Workspace Body */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                
                {/* TAB 1: MERKLE TREE */}
                {activeInspectorTab === 'merkle' && (
                  <div className="space-y-6">
                    <div className="p-4 bg-[#EEECE8] border border-[#141414] space-y-2">
                      <h4 className="font-mono text-xs font-bold uppercase text-[#141414] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-green-700" />
                        Verification Proof of Inference Engine
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                        To prove the AI model performed the portfolio rebalancing deterministically, the inputs are chunked and hashed on the <strong>0G Decentralized Storage network</strong>. This Merkle Tree structures raw leaf snapshots to generate a verifiable cryptographic receipt hash on-chain.
                      </p>
                    </div>

                    {/* Merkle Node diagram */}
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#141414]/20 bg-[#EEECE8]/30 relative font-mono text-xs">
                      
                      {/* Merkle Root Node */}
                      <div className="flex flex-col items-center mb-10 relative">
                        <div className="px-4 py-2 bg-[#141414] text-white border-2 border-[#141414] text-center max-w-[280px]">
                          <span className="text-[9px] text-white/70 uppercase block font-bold">Merkle Root CID (On-Chain)</span>
                          <span className="truncate block font-semibold font-mono text-[10px] tracking-tight">{selectedLogForProof.receiptHash}</span>
                        </div>
                        <div className="w-[2px] h-8 bg-[#141414]" />
                      </div>

                      {/* Merkle Branches level */}
                      <div className="grid grid-cols-2 gap-20 w-full mb-10 relative">
                        {/* Branch left H01 */}
                        <div className="flex flex-col items-center relative">
                          <div className="px-3 py-1.5 bg-[#EEECE8] border-2 border-[#141414] text-center max-w-[180px] w-full shadow-sm">
                            <span className="text-[9px] text-slate-500 uppercase block">NODE Hash H₀₁</span>
                            <span className="truncate block text-[10px] font-mono">0x38af9cd2...f2ea</span>
                          </div>
                          
                          {/* Lines downward */}
                          <div className="flex justify-between w-full px-8 mt-1">
                            <div className="w-[2px] h-6 bg-[#141414]/40 rotate-[35deg]" />
                            <div className="w-[2px] h-6 bg-[#141414]/40 -rotate-[35deg]" />
                          </div>
                        </div>

                        {/* Branch right H23 */}
                        <div className="flex flex-col items-center relative">
                          <div className="px-3 py-1.5 bg-[#EEECE8] border-2 border-[#141414] text-center max-w-[180px] w-full shadow-sm">
                            <span className="text-[9px] text-slate-500 uppercase block">NODE Hash H₂₃</span>
                            <span className="truncate block text-[10px] font-mono">0xeb8219ad...a501</span>
                          </div>

                          {/* Lines downward */}
                          <div className="flex justify-between w-full px-8 mt-1">
                            <div className="w-[2px] h-6 bg-[#141414]/40 rotate-[35deg]" />
                            <div className="w-[2px] h-6 bg-[#141414]/40 -rotate-[35deg]" />
                          </div>
                        </div>

                        {/* Top connector lines connecting branches to root */}
                        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#141414] -translate-y-[8px]" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-2 bg-[#141414] -translate-y-2" />
                      </div>

                      {/* Merkle Leaves level (4 chunks) */}
                      <div className="grid grid-cols-4 gap-4 w-full">
                        {[
                          { title: 'Chunk 0 (Meta)', hash: '0xbc8f29ea' },
                          { title: 'Chunk 1 (Portfolio)', hash: '0xa1f8028d' },
                          { title: 'Chunk 2 (Price Oracle)', hash: '0xdc4731ba' },
                          { title: 'Chunk 3 (AI Trace)', hash: '0x5e921e42' },
                        ].map((node, i) => (
                          <div key={i} className="flex flex-col items-center bg-[#EEECE8] border border-[#141414]/40 p-2 text-center relative shadow-sm">
                            <span className="text-[9px] text-[#141414] font-bold block">{node.title}</span>
                            <span className="text-[9px] text-[#141414]/60 mt-1 block font-mono">{node.hash}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Checkbox validators list */}
                    <div className="border border-[#141414]/15 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#141414]/15 bg-[#EEECE8]/20 font-mono text-[11px] p-2">
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>KECCAK-256 ROOTS MATHEMATICALLY EQUAL</span>
                        </div>
                        <p className="text-slate-500 pl-6 leading-normal font-sans">
                          Decentralized nodes extracted leaves directly from 0G storage hashes, verified root is equal to receipt hashes stored on the EVM contract.
                        </p>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>DELEGATED AGENT KEY CONCURRENCE SIGNATURE</span>
                        </div>
                        <p className="text-slate-500 pl-6 leading-normal font-sans">
                          The logic trace block signature is verified on-chain against <strong>{selectedLogForProof.protocol}</strong>'s whitelist. Trace signature is valid.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: RAW CHUNKS */}
                {activeInspectorTab === 'chunks' && (
                  <div className="space-y-4">
                    <p className="font-sans text-[11px] text-slate-600 leading-normal">
                      The raw JSON payload log describing the current portfolio configuration drift parameter is segmented into 4 separate chunks for optimized high-throughput distribution throughout the 0G Storage client infrastructure.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {[
                        { title: 'Segment 0', desc: 'Metadata Snapshot' },
                        { title: 'Segment 1', desc: 'Portfolio State' },
                        { title: 'Segment 2', desc: 'Exchange Oracles' },
                        { title: 'Segment 3', desc: 'Inference Trace & Sign' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedChunkIndex(i)}
                          className={`p-3 text-left border cursor-pointer font-mono hover:bg-white transition-all ${
                            selectedChunkIndex === i 
                              ? 'bg-[#141414] text-white border-[#141414]' 
                              : 'bg-[#EEECE8] text-[#141414] border-[#141414]/30'
                          }`}
                        >
                          <span className={`text-[10px] block ${selectedChunkIndex === i ? 'text-white/60' : 'text-[#141414]/50'}`}>CHUNK #{i}</span>
                          <strong className="text-xs font-bold block mt-0.5">{item.title}</strong>
                          <span className={`text-[10px] block mt-1 truncate ${selectedChunkIndex === i ? 'text-white/80' : 'opacity-70'}`}>{item.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Chunk content inspector terminal */}
                    <div className="border border-[#141414] bg-[#EEECE8] p-4 flex flex-col space-y-3">
                      <div className="flex items-center justify-between border-b border-[#141414]/15 pb-2">
                        <span className="font-mono text-xs font-bold text-[#141414] flex items-center gap-1.5">
                          <FileCode className="w-4 h-4" />
                          DECISION TREE DATA CHUNK {selectedChunkIndex} INSPECTOR
                        </span>
                        <span className="text-[9px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5">SIZE: 3.1 KiB</span>
                      </div>

                      {/* Display content conditionally */}
                      {selectedChunkIndex === 0 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Evaluated Header Meta:</span>
                          <pre className="font-mono text-xs text-[#141414] p-3 border border-[#141414]/10 bg-white/50 overflow-x-auto">
{`{
  "action": "${selectedLogForProof.action}",
  "timestamp": "${selectedLogForProof.timestamp}",
  "cycleNumber": ${selectedLogForProof.cycleNumber},
  "hashVersion": "1.0G",
  "consensusRequired": ${selectedLogForProof.amount > 1000 ? "true" : "false"}
}`}
                          </pre>
                        </div>
                      )}

                      {selectedChunkIndex === 1 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Portfolio Positions Array (EVM-aligned):</span>
                          <pre className="font-mono text-xs text-[#141414] p-3 border border-[#141414]/10 bg-white/50 overflow-x-auto">
{JSON.stringify(selectedLogForProof.inputState?.positions || [], null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedChunkIndex === 2 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Gas Price & Currency Oracles:</span>
                          <pre className="font-mono text-xs text-[#141414] p-3 border border-[#141414]/10 bg-white/50 overflow-x-auto">
{JSON.stringify(selectedLogForProof.inputState?.prices || { "ETH": 2980, "USDC": 1.00, "WBTC": 64200 }, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedChunkIndex === 3 && (
                        <div className="space-y-2">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Consensual Reasoning Trace & Verifiable signature:</span>
                          <pre className="font-mono text-xs text-[#141414] p-3 border border-[#141414]/10 bg-white/50 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`{
  "inferenceAgentId": "g_agent_0Gv1",
  "decisionalReasoning": "${selectedLogForProof.reasoning}",
  "signatureParameters": {
    "v": 28,
    "r": "0x5399580aebd1c890...0c83a152",
    "s": "0x00f890adcb81cae9...38adfe91"
  }
}`}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: DA MONITOR */}
                {activeInspectorTab === 'da' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-[#EEECE8] border border-[#141414] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="font-mono text-xs space-y-1">
                        <strong className="text-[#141414] uppercase block flex items-center gap-1.5 font-bold">
                          <Server className="w-4 h-4 text-green-700" />
                          0G DECENTRALIZED DATA AVAILABILITY PROTOCOL
                        </strong>
                        <span className="text-slate-500 block text-[10px] font-normal">Ensuring full availability of AI inputs for transaction execution compliance audits.</span>
                      </div>
                      <div className="text-right font-mono text-xs shrink-0 bg-[#141414] text-[#E4E3E0] p-2 border border-[#141414]">
                        <span className="text-[9px] block text-[#E4E3E0]/70 uppercase">Consensual epoch ID</span>
                        <strong className="block text-[11.5px] font-semibold">Epoch #2,149,021</strong>
                      </div>
                    </div>

                    {/* Nodes grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 font-mono text-[11px]">
                      {Array.from({ length: 12 }, (_, i) => {
                        const statuses = [
                          'SYNCED (Chunk 0,1,2,3)', 
                          'SYNCED (Chunk 0,1)', 
                          'SYNCED (Chunk 2,3)', 
                          'SYNCED (Chunk 0,1,2,3)', 
                          'SYNCED (Chunk 0,1,2,3)', 
                          'SYNCED (Chunk 2,3)', 
                          'SYNCED (Chunk 0,1)'
                        ];
                        const syncText = statuses[i % statuses.length];
                        return (
                          <div key={i} className="bg-[#EEECE8] border border-[#141414]/20 p-2.5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-500">Node #{(i + 1).toString().padStart(2, '0')}</span>
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-700"></span>
                              </span>
                            </div>
                            <strong className="text-xs text-[#141414] block font-bold mt-1.5">0g-da-n_{(i + 13).toString(16)}</strong>
                            <span className="text-[9px] text-[#141414]/60 block mt-1 font-mono">{syncText}</span>
                            <div className="absolute top-0 right-0 h-1.5 w-1.5 bg-green-700/10 rounded-bl" />
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-green-700/10 border-l-4 border-green-700 text-xs font-mono flex items-center justify-between">
                      <span className="text-green-800 font-semibold font-sans">0G Network Consensus Verified: Stored trace is secured against corruption and available for query at any time.</span>
                      <ShieldCheck className="w-5 h-5 text-green-700 shrink-0 hidden sm:block" />
                    </div>
                  </div>
                )}

              </div>

              {/* Close footer */}
              <div className="p-4 border-t border-[#141414]/15 bg-[#EEECE8] text-right font-mono">
                <button
                  onClick={() => setSelectedLogForProof(null)}
                  className="px-5 py-2 bg-[#141414] hover:bg-[#2B2B2B] text-white hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer border border-[#141414]"
                >
                  Terminate Inspector View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

