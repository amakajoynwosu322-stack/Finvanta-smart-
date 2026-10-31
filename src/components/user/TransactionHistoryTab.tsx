import React, { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Award,
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
import { formatNaira } from '../../utils/currency';

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
            Complete audit ledger of all deposits, withdrawals, yield payouts, task rewards, and plan allocations in Nigerian Naira (₦).
          </p>
        </div>

        <span className="text-xs font-mono text-slate-300 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30">
          Total Records: {transactions.length}
        </span>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#171225] border border-[#8B5CF6]/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'roi_payout', label: 'Yield Payouts' },
            { id: 'task_reward', label: 'Task Rewards' },
            { id: 'investment', label: 'Subscriptions' },
            { id: 'referral_bonus', label: 'Affiliates' },
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
      <div className="rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 overflow-hidden shadow-lg">
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
                  <th className="py-3 px-4">Reference / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount (NGN)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((tx) => {
                  const isCredit =
                    tx.type === 'deposit' ||
                    tx.type === 'roi_payout' ||
                    tx.type === 'referral_bonus' ||
                    (tx.type as any) === 'task_reward' ||
                    (tx.type === 'admin_adjustment' && tx.note?.includes('Transfer from Task'));

                  return (
                    <tr key={tx.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white font-mono text-xs">
                          {tx.reference || tx.id.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {tx.note || tx.paymentMethod || 'Financial Transaction'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 capitalize">
                        <span className="flex items-center gap-1.5 text-slate-200 font-medium">
                          {tx.type === 'deposit' && <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />}
                          {tx.type === 'withdrawal' && <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400" />}
                          {tx.type === 'roi_payout' && <Zap className="w-3.5 h-3.5 text-[#B66DFF]" />}
                          {(tx.type as any) === 'task_reward' && <Award className="w-3.5 h-3.5 text-amber-300" />}
                          {tx.type === 'investment' && <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          className={`font-mono font-bold text-xs sm:text-sm tabular-nums ${
                            isCredit ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
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
                        <div>{new Date(tx.createdAt).toLocaleDateString('en-NG')}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/30 text-[#C4B5FD] hover:text-white transition-colors text-[11px] font-semibold"
                        >
                          View Receipt
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Transaction Receipt</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-white flex items-center gap-1">
                  {selectedTx.id}
                  <button onClick={() => handleCopy(selectedTx.id)} className="text-[#B66DFF] hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-white">{selectedTx.reference || selectedTx.id}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Category:</span>
                <span className="text-white capitalize">{selectedTx.type.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Amount:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm tabular-nums">
                  {formatNaira(selectedTx.amount)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Currency:</span>
                <span className="text-white font-mono">Nigerian Naira (NGN / ₦)</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold uppercase font-mono">{selectedTx.status}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Description:</span>
                <span className="text-white text-right max-w-[200px]">{selectedTx.note || 'None'}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-white font-mono">{new Date(selectedTx.createdAt).toLocaleString('en-NG')}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
