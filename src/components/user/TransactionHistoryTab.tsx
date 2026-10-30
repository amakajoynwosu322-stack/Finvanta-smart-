import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Briefcase,
  Calendar,
  CheckCircle,
  Copy,
  ExternalLink,
  Filter,
  History,
  Info,
  Search,
  Sparkles,
  Zap
} from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionHistoryTabProps {
  transactions: Transaction[];
}

export const TransactionHistoryTab: React.FC<TransactionHistoryTabProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    const matchesSearch =
      tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.note?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <History className="w-5 h-5 text-[#B66DFF]" />
            Audit Ledger & Transaction History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete cryptographic audit log of all deposits, withdrawals, yield harvests, and allocations.
          </p>
        </div>

        <span className="text-xs font-mono text-slate-400 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#171225] border border-slate-800">
          Total Records: {transactions.length}
        </span>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'roi_payout', label: 'Yield Payouts' },
            { id: 'investment', label: 'Allocations' },
            { id: 'referral_bonus', label: 'Referrals' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === item.id
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#090711]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#090711] border border-[#8B5CF6]/20 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#B66DFF]"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No transactions found</h4>
            <p className="text-xs text-slate-400 mt-1">Try resetting search filters or execute an action.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090711]/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction / ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((tx) => {
                  const isNegative = tx.type === 'withdrawal' || (tx.type === 'investment' && tx.amount > 0);
                  return (
                    <tr key={tx.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white font-mono text-xs">
                          {tx.reference || tx.id.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {tx.note || tx.paymentMethod || 'Quantitative transaction'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 capitalize">
                        <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                          {tx.type === 'deposit' && <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          {tx.type === 'withdrawal' && <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />}
                          {tx.type === 'roi_payout' && <Zap className="w-3.5 h-3.5 text-[#B66DFF]" />}
                          {tx.type === 'investment' && <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`font-mono font-bold text-xs ${
                            tx.type === 'withdrawal'
                              ? 'text-amber-400'
                              : tx.type === 'deposit' || tx.type === 'roi_payout'
                              ? 'text-emerald-400'
                              : 'text-white'
                          }`}
                        >
                          {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()} {tx.currency || 'USD'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-[#171225] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white text-[11px] font-medium transition-colors"
                        >
                          Audit Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl glow-purple">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Cryptographic Transaction Receipt</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#090711] border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Settled Amount</span>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  ${selectedTx.amount.toLocaleString()} {selectedTx.currency || 'USD'}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase">
                  Status: {selectedTx.status}
                </span>
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Transaction ID:</span>
                  <div className="flex items-center gap-1.5 font-mono text-white">
                    <span>{selectedTx.id}</span>
                    <button
                      onClick={() => handleCopy(selectedTx.id)}
                      className="text-slate-400 hover:text-[#B66DFF]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-white">{selectedTx.reference || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Category:</span>
                  <span className="capitalize text-white font-medium">{selectedTx.type.replace('_', ' ')}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Note / Strategy:</span>
                  <span className="text-white text-right max-w-[200px] truncate">{selectedTx.note || 'None'}</span>
                </div>

                {selectedTx.destinationAddress && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Destination:</span>
                    <span className="font-mono text-amber-400 truncate max-w-[180px]">
                      {selectedTx.destinationAddress}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Settlement Time:</span>
                  <span className="text-white font-mono">{new Date(selectedTx.createdAt).toUTCString()}</span>
                </div>
              </div>
            </div>

            {copiedHash && (
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 text-center text-xs font-semibold">
                Copied hash to clipboard!
              </div>
            )}

            <button
              onClick={() => setSelectedTx(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold transition-all"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
