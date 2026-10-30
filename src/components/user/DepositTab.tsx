import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  CheckCircle,
  Copy,
  Info,
  QrCode,
  Shield,
  ShieldAlert,
  Sparkles,
  Wallet
} from 'lucide-react';
import { DepositRequest, PlatformConfig, UserProfile } from '../../types';
import { submitDepositRequest } from '../../services/db';
import confetti from 'canvas-confetti';

interface DepositTabProps {
  user: UserProfile;
  config?: PlatformConfig;
  depositRequests: DepositRequest[];
  onRefresh: () => void;
}

export const DepositTab: React.FC<DepositTabProps> = ({
  user,
  config,
  depositRequests,
  onRefresh
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<'USDT_TRC20' | 'USDT_ERC20' | 'BTC' | 'ETH'>('USDT_TRC20');
  const [amount, setAmount] = useState<number>(500);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const addresses = {
    USDT_TRC20: {
      currency: 'USDT',
      network: 'TRC-20',
      address: config?.usdtTrc20Address || 'TN7zK4qP89FinvantaTRC20Official94bX',
      min: config?.minDeposit || 50,
      fee: '0.00 USDT (Simulated)',
      confirmations: '1 network block',
    },
    USDT_ERC20: {
      currency: 'USDT',
      network: 'ERC-20',
      address: '0x71C5d92e8B5CF6d090711FinvantaUSDT92a',
      min: 100,
      fee: '0.00 USDT (Simulated)',
      confirmations: '6 network blocks',
    },
    BTC: {
      currency: 'BTC',
      network: 'Bitcoin Native SegWit',
      address: config?.btcAddress || 'bc1q9finvantaapexinvestments8492048hqf02k7z',
      min: 100,
      fee: '0.0001 BTC (Simulated)',
      confirmations: '2 network blocks',
    },
    ETH: {
      currency: 'ETH',
      network: 'Ethereum Mainnet',
      address: config?.ethAddress || '0x8B5CF6d090711FinvantaMainnetVault92a',
      min: 100,
      fee: '0.001 ETH (Simulated)',
      confirmations: '12 network blocks',
    },
  };

  const current = addresses[selectedCurrency];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < current.min) {
      setFeedback({ type: 'error', message: `Minimum deposit for ${current.currency} is $${current.min}` });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await submitDepositRequest(user, amount, current.currency, current.network);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 }
        });
        setFeedback({ type: 'success', message: res.message });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to submit deposit.' });
    } finally {
      setSubmitting(false);
    }
  };

  const userDeposits = depositRequests.filter((d) => d.userId === user.uid);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Simulation Disclaimer Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold text-white block">DEMO & SIMULATION GATEWAY ONLY</span>
          This is an interactive simulation sandbox for evaluating FINVANTA. Do NOT send real cryptocurrency or fiat. Submitting a simulated deposit generates a test transaction queued for administrative approval or immediate sandbox balance credit.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            Simulated Deposit Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate simulated wallet addresses and credit test liquidity into your portfolio balance.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Current Balance:</span>
          <span className="font-bold text-white font-mono">${(user.balance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Grid: Form + QR & Address Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Network selector & Amount form */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <form onSubmit={handleSubmitDeposit} className="space-y-5">
            {/* Asset / Network selector */}
            <div>
              <label className="text-xs text-slate-300 block mb-2 font-medium">Select Deposit Currency & Network</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'USDT_TRC20', name: 'USDT', net: 'TRC-20' },
                  { id: 'USDT_ERC20', name: 'USDT', net: 'ERC-20' },
                  { id: 'BTC', name: 'BTC', net: 'SegWit' },
                  { id: 'ETH', name: 'ETH', net: 'ERC-20' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedCurrency(item.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      selectedCurrency === item.id
                        ? 'bg-[#8B5CF6]/20 border-[#B66DFF] text-white shadow-sm'
                        : 'bg-[#090711]/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{item.name}</div>
                    <div className="text-[10px] text-[#B66DFF] font-mono">{item.net}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input & presets */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Deposit Amount (USD)</span>
                <span className="text-slate-500 font-mono">Min: ${current.min}</span>
              </div>
              <input
                type="number"
                min={current.min}
                step={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-2xl py-3 px-4 text-base font-bold font-mono text-white focus:outline-none focus:border-[#B66DFF]"
              />

              {/* Quick preset buttons */}
              <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                {[100, 500, 1000, 2500, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="px-3 py-1 rounded-xl bg-[#090711] border border-slate-800 text-slate-300 hover:text-white hover:border-[#8B5CF6]/50 text-xs font-mono font-medium transition-all"
                  >
                    +${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Protocol Notice */}
            <div className="p-4 rounded-2xl bg-[#090711]/60 border border-slate-800 space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Network Protocol:</span>
                <span className="font-mono text-white font-semibold">{current.network}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Speed:</span>
                <span className="font-mono text-emerald-400 font-semibold">{current.confirmations}</span>
              </div>
              <div className="flex justify-between">
                <span>Simulated Deposit Fee:</span>
                <span className="font-mono text-white font-semibold">{current.fee}</span>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || amount < current.min}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowDownCircle className="w-4 h-4" />
              {submitting ? 'Broadcasting Simulated Payload...' : `Submit Simulated Deposit of $${amount.toLocaleString()}`}
            </button>
          </form>
        </div>

        {/* Right Col: QR Visual & Address Display */}
        <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-4">
              Simulated Gateway Vault Address
            </span>

            {/* Stylized QR Code Visual */}
            <div className="w-44 h-44 mx-auto p-3.5 rounded-3xl bg-white flex flex-col items-center justify-center shadow-xl shadow-[#8B5CF6]/15 relative group">
              {/* Dynamic QR SVG Pattern */}
              <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                <rect x="5" y="5" width="25" height="25" rx="3" fill="#171225" />
                <rect x="10" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
                <rect x="14" y="14" width="7" height="7" fill="#8B5CF6" />

                <rect x="70" y="5" width="25" height="25" rx="3" fill="#171225" />
                <rect x="75" y="10" width="15" height="15" rx="2" fill="#FFFFFF" />
                <rect x="79" y="14" width="7" height="7" fill="#8B5CF6" />

                <rect x="5" y="70" width="25" height="25" rx="3" fill="#171225" />
                <rect x="10" y="75" width="15" height="15" rx="2" fill="#FFFFFF" />
                <rect x="14" y="79" width="7" height="7" fill="#8B5CF6" />

                {/* Random decorative code matrix pixels */}
                <rect x="36" y="8" width="6" height="6" fill="#171225" />
                <rect x="46" y="8" width="6" height="6" fill="#171225" />
                <rect x="56" y="14" width="6" height="6" fill="#171225" />
                <rect x="36" y="24" width="6" height="6" fill="#171225" />
                <rect x="48" y="24" width="6" height="6" fill="#171225" />

                <rect x="10" y="40" width="6" height="6" fill="#171225" />
                <rect x="24" y="44" width="6" height="6" fill="#171225" />
                <rect x="40" y="40" width="20" height="20" rx="3" fill="#8B5CF6" />

                <rect x="70" y="40" width="6" height="6" fill="#171225" />
                <rect x="84" y="44" width="6" height="6" fill="#171225" />
                <rect x="36" y="72" width="6" height="6" fill="#171225" />
                <rect x="48" y="80" width="6" height="6" fill="#171225" />
                <rect x="68" y="72" width="6" height="6" fill="#171225" />
                <rect x="80" y="80" width="6" height="6" fill="#171225" />
              </svg>
            </div>

            {/* Address Box */}
            <div className="mt-5 p-3 rounded-2xl bg-[#090711] border border-[#8B5CF6]/30 text-left">
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">
                {current.currency} ({current.network}) Address:
              </div>
              <div className="text-xs font-mono text-white break-all select-all font-semibold">
                {current.address}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="mt-3 w-full py-2.5 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/35 border border-[#8B5CF6]/40 text-[#B66DFF] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied to Clipboard!' : 'Copy Address'}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 mt-4">
            Simulated wallet rotates automatically every 180 days for maximum liquidity privacy.
          </div>
        </div>
      </div>

      {/* User's Previous Deposit Requests Status Feed */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">My Submitted Deposit Requests</h3>
        {userDeposits.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            You haven't submitted any deposit verification requests yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Asset / Network</th>
                  <th className="py-2.5 px-3">Simulated Hash</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userDeposits.map((req) => (
                  <tr key={req.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-white">{req.id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-3 font-bold text-emerald-400 font-mono">
                      +${req.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {req.currency} ({req.network})
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-[140px]" title={req.txHash}>
                      {req.txHash.slice(0, 10)}...{req.txHash.slice(-6)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
