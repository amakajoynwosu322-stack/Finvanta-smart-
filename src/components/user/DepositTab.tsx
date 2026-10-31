import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownCircle,
  Building,
  CheckCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Info,
  Phone,
  QrCode,
  Shield,
  ShieldAlert,
  Sparkles,
  Wallet,
  Zap
} from 'lucide-react';
import { DepositRequest, PlatformConfig, UserProfile } from '../../types';
import { submitDepositRequest } from '../../services/db';
import { formatNaira } from '../../utils/currency';
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
  const [selectedMethod, setSelectedMethod] = useState<'bank_transfer' | 'card_gateway' | 'ussd'>('bank_transfer');
  const [amount, setAmount] = useState<number>(50000);
  const [depositorName, setDepositorName] = useState<string>(user.displayName || '');
  const [paymentNarration, setPaymentNarration] = useState<string>(`FIN-${user.referralCode || 'NGN'}`);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const virtualAccount = {
    bankName: 'Wema Bank / FINVANTA Treasury',
    accountNumber: '0124896721',
    accountName: `FINVANTA / ${user.displayName}`,
    currency: 'NGN (₦)',
    minDeposit: config?.minDeposit || 10000,
    settlementTime: 'Instant (Simulated)',
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < virtualAccount.minDeposit) {
      setFeedback({
        type: 'error',
        message: `Minimum simulated deposit is ${formatNaira(virtualAccount.minDeposit)}.`
      });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const network = selectedMethod === 'bank_transfer'
        ? 'Nigerian NGN Bank Transfer'
        : selectedMethod === 'card_gateway'
        ? 'Instant NGN Debit Gateway'
        : 'USSD Bank Transfer';

      const res = await submitDepositRequest(user, amount, 'NGN', network);
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
      {/* Simulation Notice Banner */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold text-white block">DEMONSTRATION & SIMULATION SANDBOX</span>
          This is an educational simulation environment for testing FINVANTA wealth growth workflows. Do NOT send real funds. Submitting a simulated deposit generates an NGN test ledger entry queued for administrative approval or immediate sandbox wallet funding.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-[#B66DFF]" />
            Fund Wallet (Simulated NGN)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deposit Nigerian Naira (₦) into your simulated liquid balance via bank transfer or virtual account.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30">
          <span className="text-slate-400">Current Balance:</span>
          <span className="text-emerald-400 font-bold">{formatNaira(user.balance)}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method & Settlement Card */}
        <div className="lg:col-span-2 space-y-5">
          {/* Channel Selector */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMethod('bank_transfer')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center ${
                selectedMethod === 'bank_transfer'
                  ? 'bg-[#23183d] border-[#8B5CF6] text-white shadow-lg'
                  : 'bg-[#171225] border-[#8B5CF6]/20 text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-5 h-5 text-[#B66DFF] mb-1.5" />
              <span className="text-xs font-bold">Virtual Bank Transfer</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Instant NGN</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card_gateway')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center ${
                selectedMethod === 'card_gateway'
                  ? 'bg-[#23183d] border-[#8B5CF6] text-white shadow-lg'
                  : 'bg-[#171225] border-[#8B5CF6]/20 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5 text-emerald-400 mb-1.5" />
              <span className="text-xs font-bold">Debit Card (Simulated)</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Mastercard/Visa/Verve</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('ussd')}
              className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center ${
                selectedMethod === 'ussd'
                  ? 'bg-[#23183d] border-[#8B5CF6] text-white shadow-lg'
                  : 'bg-[#171225] border-[#8B5CF6]/20 text-slate-400 hover:text-white'
              }`}
            >
              <Phone className="w-5 h-5 text-amber-400 mb-1.5" />
              <span className="text-xs font-bold">Bank USSD Code</span>
              <span className="text-[10px] text-slate-400 mt-0.5">*737# / *945#</span>
            </button>
          </div>

          {/* Virtual Account Details Box */}
          <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Simulated NGN Dedicated Account
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Auto-Credit Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Bank Name</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{virtualAccount.bankName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Account Name</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{virtualAccount.accountName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Currency</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">Nigerian Naira (NGN / ₦)</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Minimum Deposit</span>
                <span className="text-sm font-bold text-white mt-0.5 block">{formatNaira(virtualAccount.minDeposit)}</span>
              </div>
            </div>

            {/* Account Number Box with 1-Click Copy */}
            <div className="p-4 rounded-2xl bg-[#0f0b18] border border-[#8B5CF6]/40 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Dedicated NGN Account Number</span>
                <span className="text-xl sm:text-2xl font-black text-[#B66DFF] tracking-wider font-mono">
                  {virtualAccount.accountNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitDeposit} className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Submit Simulated Deposit Notification</h3>

            {feedback && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Deposit Amount in Nigerian Naira (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 font-mono">
                  ₦
                </span>
                <input
                  type="number"
                  min={virtualAccount.minDeposit}
                  step="5000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#0d0918] border border-[#8B5CF6]/30 rounded-xl pl-8 pr-4 py-3 text-white text-base font-bold tabular-nums focus:outline-none focus:border-[#8B5CF6]"
                  placeholder="50000"
                  required
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[20000, 50000, 100000, 250000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                      amount === preset
                        ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                        : 'bg-[#100b1d] border-[#8B5CF6]/20 text-slate-400 hover:text-white'
                    }`}
                  >
                    {formatNaira(preset, false)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Sender / Depositor Name</label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  className="w-full bg-[#0d0918] border border-[#8B5CF6]/30 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#8B5CF6]"
                  placeholder="e.g. Amaka Nwosu"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Transfer Narration / Reference</label>
                <input
                  type="text"
                  value={paymentNarration}
                  onChange={(e) => setPaymentNarration(e.target.value)}
                  className="w-full bg-[#0d0918] border border-[#8B5CF6]/30 rounded-xl px-4 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#8B5CF6]"
                  placeholder="e.g. FIN-ABC123"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white font-bold text-xs transition-all shadow-lg active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{submitting ? 'Submitting Notification...' : `Simulate Deposit of ${formatNaira(amount)}`}</span>
            </button>
          </form>
        </div>

        {/* Deposit History & Status */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Deposit Guidelines</h3>
            <ul className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>All amounts are recorded and settled in <strong>Nigerian Naira (₦ / NGN)</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Simulated credits automatically reflect in your Main Liquid Balance once recorded.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero transaction fees applied on all simulated NGN wallet funding.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-lg">
            <h3 className="text-sm font-bold text-white mb-3">Recent Deposit Requests</h3>
            {userDeposits.length > 0 ? (
              <div className="space-y-2.5">
                {userDeposits.slice(0, 5).map((dep) => (
                  <div key={dep.id} className="p-3 rounded-xl bg-[#100b1d] border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block tabular-nums">{formatNaira(dep.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(dep.createdAt).toLocaleDateString('en-NG')}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        dep.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : dep.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {dep.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No deposit requests submitted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
