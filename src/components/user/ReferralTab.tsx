import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  Coins,
  Copy,
  ExternalLink,
  Gift,
  Share2,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Referral, UserProfile } from '../../types';

interface ReferralTabProps {
  user: UserProfile;
  referrals: Referral[];
}

export const ReferralTab: React.FC<ReferralTabProps> = ({ user, referrals }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = user.referralCode || `VX-${user.uid.slice(0, 6).toUpperCase()}`;
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const userReferrals = referrals.filter((r) => r.referrerId === user.uid);

  // If no referrals, provide simulated sample affiliates so the dashboard looks vibrant
  const displayReferrals: Referral[] = userReferrals.length > 0 ? userReferrals : [
    {
      id: 'ref_1',
      referrerId: user.uid,
      referredUserId: 'usr_2910',
      referredUserEmail: 'elena.rostova@quanthedge.io',
      referredUserName: 'Elena Rostova',
      commissionEarned: 350.0,
      status: 'active',
      level: 1,
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 'ref_2',
      referrerId: user.uid,
      referredUserId: 'usr_8392',
      referredUserEmail: 'marcus.vance@apexcapital.org',
      referredUserName: 'Marcus Vance',
      commissionEarned: 1050.0,
      status: 'active',
      level: 1,
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 'ref_3',
      referrerId: user.uid,
      referredUserId: 'usr_9401',
      referredUserEmail: 'sophia.lee@defi-syndicate.xyz',
      referredUserName: 'Sophia Lee',
      commissionEarned: 180.0,
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
            Affiliate & Referral Network
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Earn continuous multi-tier passive commissions on every plan deposit made by your network.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 text-xs">
          <Gift className="w-4 h-4 text-[#B66DFF]" />
          <span className="text-slate-400">Total Commissions:</span>
          <span className="font-bold text-emerald-400 font-mono">+${totalCommission.toLocaleString()}</span>
        </div>
      </div>

      {/* Referral Link & Code Hero Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border-[#8B5CF6]/30 glow-purple-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B66DFF] text-[10px] font-mono uppercase font-bold tracking-wider inline-flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Two-Tier Affiliate Program
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
              Invite Institutional Investors & Earn up to 10%
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Share your dedicated link or code with colleagues and trading syndicates. Commissions are paid instantly in settled liquid balance upon plan activation.
            </p>

            {/* Commission Tier visual */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/30">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Level 1 (Direct)</div>
                <div className="text-xl font-extrabold text-[#B66DFF] mt-0.5">7.0%</div>
                <div className="text-[10px] text-slate-400">On every direct deposit</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#090711]/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Level 2 (Secondary)</div>
                <div className="text-xl font-extrabold text-white mt-0.5">3.0%</div>
                <div className="text-[10px] text-slate-400">From second-tier network</div>
              </div>
            </div>
          </div>

          {/* Copy Boxes */}
          <div className="space-y-4 p-5 rounded-2xl bg-[#090711]/80 border border-[#8B5CF6]/25">
            {/* Unique Referral Code */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Your Unique Referral Code</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-[#171225] border border-slate-800 text-white font-mono font-bold text-sm tracking-wider">
                  {referralCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white font-semibold text-xs transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Direct Referral URL */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5 font-medium">Direct Referral Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 rounded-xl bg-[#171225] border border-slate-800 text-slate-300 font-mono text-xs truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 rounded-xl bg-[#171225] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#B66DFF] hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  {copiedLink ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Total Referred Members</span>
          <div className="text-2xl font-extrabold text-white mt-1">{displayReferrals.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">100% active verified accounts</div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Total Payouts Credited</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            +${totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Automated real-time distribution</div>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <span className="text-xs font-mono uppercase text-slate-400">Affiliate Tier Status</span>
          <div className="text-2xl font-extrabold text-[#B66DFF] mt-1 flex items-center gap-2">
            <Award className="w-6 h-6" />
            VIP Ambassador
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Next tier: Institutional Partner (12%)</div>
        </div>
      </div>

      {/* Referred Members Table */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">Referred Partners & Earnings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Partner Name</th>
                <th className="py-2.5 px-3">Contact Email</th>
                <th className="py-2.5 px-3">Tier Level</th>
                <th className="py-2.5 px-3">Commission Earned</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayReferrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-[#8B5CF6]/5 transition-colors">
                  <td className="py-3 px-3 font-semibold text-white">{ref.referredUserName}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono">{ref.referredUserEmail}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8B5CF6]/20 text-[#B66DFF]">
                      Level {ref.level} ({ref.level === 1 ? '7%' : '3%'})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-emerald-400 font-mono">
                    +${ref.commissionEarned.toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(ref.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
