import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Lock,
  Shield,
  ShieldAlert,
  Wallet
} from 'lucide-react';
import { PlatformConfig, UserProfile, WithdrawalRequest } from '../../types';
import { submitWithdrawalRequest } from '../../services/db';

interface WithdrawalTabProps {
  user: UserProfile;
  config?: PlatformConfig;
  withdrawalRequests: WithdrawalRequest[];
  onRefresh: () => void;
}

export const WithdrawalTab: React.FC<WithdrawalTabProps> = ({
  user,
  config,
  withdrawalRequests,
  onRefresh
}) => {
  const [currency, setCurrency] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  const [network, setNetwork] = useState<string>('TRC-20');
  const [amount, setAmount] = useState<number>(200);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('849201');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const minWithdrawal = config?.minWithdrawal || 25;
  const feePercentage = config?.withdrawalFeePercentage || 1.5;

  const feeAmount = (amount * feePercentage) / 100;
  const netPayout = Math.max(0, amount - feeAmount);

  const handleCurrencyChange = (curr: 'USDT' | 'BTC' | 'ETH') => {
    setCurrency(curr);
    if (curr === 'USDT') setNetwork('TRC-20');
    if (curr === 'BTC') setNetwork('Bitcoin SegWit');
    if (curr === 'ETH') setNetwork('Ethereum ERC-20');
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < minWithdrawal) {
      setFeedback({ type: 'error', message: `Minimum withdrawal is $${minWithdrawal}.` });
      return;
    }
    if (amount > user.balance) {
      setFeedback({ type: 'error', message: `Insufficient liquid balance ($${user.balance.toFixed(2)}).` });
      return;
    }
    if (!destinationAddress || destinationAddress.length < 12) {
      setFeedback({ type: 'error', message: 'Please specify a valid destination wallet address.' });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const res = await submitWithdrawalRequest(user, amount, currency, network, destinationAddress);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        setDestinationAddress('');
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to submit withdrawal.' });
    } finally {
      setSubmitting(false);
    }
  };

  const userWithdrawals = withdrawalRequests.filter((w) => w.userId === user.uid);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Simulation Notice */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold text-white block">SIMULATED PAYOUT DESK</span>
          Withdrawals simulate real blockchain outbound dispatch. No real funds or fiat are sent. When approved by the platform administrator, the payout completes in your simulation ledger.
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <ArrowUpCircle className="w-5 h-5 text-amber-400" />
            Simulated Withdrawal Gateway
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch liquid capital to your designated external wallet address.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Available:</span>
          <span className="font-bold text-white font-mono">${(user.balance || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
            {/* Currency selector */}
            <div>
              <label className="text-xs text-slate-300 block mb-2 font-medium">Payout Currency</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['USDT', 'BTC', 'ETH'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      currency === curr
                        ? 'bg-[#8B5CF6]/20 border-[#B66DFF] text-white shadow-sm'
                        : 'bg-[#090711]/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{curr}</div>
                    <div className="text-[10px] text-[#B66DFF] font-mono">
                      {curr === 'USDT' ? 'TRC-20' : curr === 'BTC' ? 'SegWit' : 'ERC-20'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-300">Amount to Withdraw (USD)</span>
                <button
                  type="button"
                  onClick={() => setAmount(Math.floor(user.balance || 0))}
                  className="text-[#B66DFF] hover:underline font-bold"
                >
                  Withdraw All (${(user.balance || 0).toLocaleString()})
                </button>
              </div>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={minWithdrawal}
                  max={user.balance}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-2xl py-3 pl-9 pr-4 text-base font-bold font-mono text-white focus:outline-none focus:border-[#B66DFF]"
                />
              </div>
            </div>

            {/* Destination Wallet Address */}
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                Destination {currency} ({network}) Wallet Address
              </label>
              <input
                type="text"
                placeholder={
                  currency === 'USDT'
                    ? 'e.g. TXyZ9... (TRC-20 Tron address)'
                    : currency === 'BTC'
                    ? 'e.g. bc1q... (Bitcoin SegWit address)'
                    : 'e.g. 0x... (Ethereum address)'
                }
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-2xl py-3 px-4 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#B66DFF]"
              />
            </div>

            {/* Simulated 2FA Confirmation Code */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#B66DFF]" />
                  Simulated 2FA Authenticator Code
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Test code pre-filled</span>
              </div>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                className="w-full sm:w-48 bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-[#B66DFF]"
              />
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
              disabled={submitting || amount < minWithdrawal || amount > user.balance || !destinationAddress}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white font-bold text-sm shadow-lg shadow-[#8B5CF6]/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <ArrowUpCircle className="w-4 h-4" />
              {submitting ? 'Escrowing Simulated Funds...' : `Confirm Withdrawal of $${amount.toLocaleString()}`}
            </button>
          </form>
        </div>

        {/* Right Col: Fee Breakdown Summary */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide mb-1">Disbursement Breakdown</h3>
            <p className="text-xs text-slate-400 mb-5">Settlement parameters & gas calculations</p>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Requested Amount:</span>
                <span className="font-bold text-white font-mono">${amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Network Gas Fee ({feePercentage}%):</span>
                <span className="font-semibold text-amber-400 font-mono">-${feeAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Minimum Threshold:</span>
                <span className="font-mono text-slate-300">${minWithdrawal.toFixed(2)}</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#090711] border border-[#8B5CF6]/30 mt-4">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Net Settlement to Wallet:
                </span>
                <div className="text-2xl font-black text-[#B66DFF] font-mono mt-1">
                  ${netPayout.toFixed(2)} {currency}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Simulated withdrawals process within 10-30 minutes upon administrative approval.</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Queue Feed */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">My Withdrawal Requests</h3>
        {userWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No withdrawal requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Destination Wallet</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userWithdrawals.map((req) => (
                  <tr key={req.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-white">{req.id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 px-3 font-bold text-amber-400 font-mono">
                      -${req.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {req.currency} ({req.network})
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-[160px]" title={req.walletAddress}>
                      {req.walletAddress.slice(0, 8)}...{req.walletAddress.slice(-6)}
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
