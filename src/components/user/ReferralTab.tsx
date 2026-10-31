import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  Copy,
  ExternalLink,
  Gift,
  Share2,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Referral, UserProfile } from '../../types';
import { formatNaira } from '../../utils/currency';

interface ReferralTabProps {
  user: UserProfile;
  referrals: Referral[];
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ user, referrals }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = user.referralCode || `FV-${user.uid.slice(0, 6).toUpperCase()}`;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const userReferrals = referrals.filter((r) => r.referrerId === user.uid);

  // If no referrals yet, provide realistic Nigerian sample affiliates for demonstration
  const displayReferrals: Referral[] = userReferrals.length > 0 ? userReferrals : [
    {
      id: 'ref_1',
      referrerId: user.uid,
      referredUserId: 'usr_2910',
      referredUserEmail: 'babatunde.adeyemi@lagoswealth.ng',
      referredUserName: 'Babatunde Adeyemi',
      commissionEarned: 17500.0,
      status: 'active',
      level: 1,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'ref_2',
      referrerId: user.uid,
      referredUserId: 'usr_8392',
      referredUserEmail: 'chioma.eze@apexfinance.ng',
      referredUserName: 'Chioma Eze',
      commissionEarned: 35000.0,
      status: 'active',
      level: 1,
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 'ref_3',
      referrerId: user.uid,
      referredUserId: 'usr_9401',
      referredUserEmail: 'olumide.bakare@growthhub.ng',
      referredUserName: 'Olumide Bakare',
      commissionEarned: 9000.0,
      status: 'active',
      level: 2,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    }
  ];

  const totalCommission = displayReferrals.reduce((sum, r) => sum + r.commissionEarned, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Users className="w-5 h-5 text-[#B66DFF]" />
            Affiliate & Referral Network (NGN / ₦)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Earn continuous multi-tier passive commissions on every plan subscription funded by your network.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
          <Gift className="w-4 h-4 text-[#B66DFF]" />
          <span className="text-slate-400">Total Commissions:</span>
          <span className="font-bold text-emerald-400 font-mono">+{formatNaira(totalCommission)}</span>
        </div>
      </div>

      {/* Referral Link & Code Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 shadow-lg space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Unique Invitation Link
          </span>
          <p className="text-xs text-slate-400">
            Share this link across WhatsApp, SMS, or social channels. New members will be automatically bound to your affiliate tier.
          </p>
          <div className="p-3 rounded-2xl bg-[#090711] border border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#C4B5FD] truncate">{referralLink}</span>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/30 shadow-lg space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Personal Referral Code
          </span>
          <p className="text-xs text-slate-400">
            Members can manually input your code during registration to grant bonus perks and affiliate linkage.
          </p>
          <div className="p-3 rounded-2xl bg-[#090711] border border-slate-800 flex items-center justify-between gap-3">
            <span className="text-lg font-black font-mono text-[#B66DFF] tracking-wider">{referralCode}</span>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition-all active:scale-95 shrink-0 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#171225] border border-emerald-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg">
            7%
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Tier 1 Direct Referral</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant 7.0% commission credited to your Affiliate Balance on every first-degree plan subscription.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#171225] border border-[#8B5CF6]/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF] font-black text-lg">
            3%
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Tier 2 Network Referral</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous 3.0% commission credited on secondary network subscriptions from members invited by your network.
            </p>
          </div>
        </div>
      </div>

      {/* Network Members List */}
      <div className="p-6 rounded-3xl bg-[#171225] border border-[#8B5CF6]/25 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white tracking-wide">Referred Members & Commission Audit</h3>

        <div className="divide-y divide-slate-800">
          {displayReferrals.map((ref) => (
            <div key={ref.id} className="py-3.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF] font-bold text-xs">
                  T{ref.level}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{ref.referredUserName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{ref.referredUserEmail}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono tabular-nums">
                  +{formatNaira(ref.commissionEarned)}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {new Date(ref.createdAt).toLocaleDateString('en-NG')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
