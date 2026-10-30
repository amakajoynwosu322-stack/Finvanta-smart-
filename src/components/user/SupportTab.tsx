import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Headphones,
  LifeBuoy,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { SupportTicket, UserProfile } from '../../types';
import { createSupportTicket } from '../../services/db';

interface SupportTabProps {
  user: UserProfile;
  tickets: SupportTicket[];
  onRefresh: () => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({ user, tickets, onRefresh }) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('general');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const userTickets = tickets.filter((t) => t.userId === user.uid);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      const res = await createSupportTicket(user, subject, category, priority, message);
      if (res.success) {
        setFeedback(res.message);
        setSubject('');
        setMessage('');
        setShowNewModal(false);
        setTimeout(() => setFeedback(null), 4000);
        onRefresh();
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How frequently are daily ROI profits distributed to my account balance?',
      a: 'Daily yields accrue automatically every 24 hours from the exact timestamp of plan activation. You can also manually harvest accrued profits to your liquid balance at any moment through the Overview or My Investments dashboard.'
    },
    {
      q: 'Is my principal capital returned when the investment plan reaches maturity?',
      a: 'Yes. All FINVANTA quantum and arbitrage strategies feature 100% Principal Capital Return. Upon contract expiration, your original deposit unlocks automatically into your liquid available balance.'
    },
    {
      q: 'How does the simulated deposit and withdrawal gateway work?',
      a: 'This application operates in a dedicated financial sandbox environment. Simulated deposits are registered and reviewed by the administrative queue, allowing you to test liquidity deployment and portfolio scaling with zero capital risk.'
    },
    {
      q: 'How do referral affiliate commissions calculate?',
      a: 'You earn 7.0% instant liquid commission on all Level 1 direct invitee deposits, and 3.0% on Level 2 indirect network deposits. Earnings are immediately withdrawable or reinvestable.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#B66DFF]" />
            24/7 Quantitative Desk & Support
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Direct access to dedicated portfolio engineers, transaction audits, and institutional assistance.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-md self-start sm:self-auto active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Support Ticket
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Support Status & Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tickets List */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-wide">My Support Inquiries</h3>
            <span className="text-xs font-mono text-slate-400">{userTickets.length} Total Tickets</span>
          </div>

          {userTickets.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-[#090711]/60 border border-slate-800">
              <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">No active inquiries</h4>
              <p className="text-xs text-slate-400 mt-1">
                Have a question regarding plans, deposits, or yields? Our engineering team is standing by.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold"
              >
                Open First Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-4 rounded-2xl bg-[#090711]/70 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 cursor-pointer transition-all flex items-start justify-between gap-4 group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-500">#{t.id.slice(-6).toUpperCase()}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#8B5CF6]/20 text-[#C4B5FD] uppercase">
                        {t.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.status === 'open'
                            ? 'bg-amber-500/15 text-amber-300'
                            : t.status === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-indigo-500/15 text-indigo-300'
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-[#B66DFF] transition-colors">
                      {t.subject}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.message}</p>

                    {t.adminReply && (
                      <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Admin Reply Received (Click to view)
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Channels Card */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide mb-1">Instant Desk Channels</h3>
            <p className="text-xs text-slate-400 mb-5">Enterprise SLA & Escalation</p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Institutional Email</div>
                <div className="text-xs font-bold text-white font-mono mt-0.5">desk@finvanta.com</div>
                <div className="text-[10px] text-emerald-400 mt-1">Average Response: &lt; 15 mins</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Telegram VIP Channel</div>
                <div className="text-xs font-bold text-white font-mono mt-0.5">@FinvantaOfficial</div>
                <div className="text-[10px] text-slate-400 mt-1">24/7 automated alerts & announcements</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#090711]/70 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Global Liquidity Status</div>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">All 14 Nodes Operational</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Encrypted end-to-end via TLS 1.3 protocol.
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="text-base font-bold text-white tracking-wide mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-[#090711]/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-white hover:text-[#B66DFF] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-slate-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl glow-purple">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Support Inquiry</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Inquiry Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding Quantum Alpha daily ROI compounding"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="deposit">Deposit Verification</option>
                    <option value="withdrawal">Withdrawal Status</option>
                    <option value="investment">Yield & Plans</option>
                    <option value="security">Account Security</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-medium">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Standard</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-medium">Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry with relevant dates or transaction references..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#B66DFF] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Dispatch Ticket to Desk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#171225] border border-[#8B5CF6]/40 rounded-3xl p-6 shadow-2xl glow-purple">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-400">#{selectedTicket.id}</span>
                <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#090711] border border-slate-800">
                <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">Your Inquiry:</div>
                <p className="text-slate-300 leading-relaxed">{selectedTicket.message}</p>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                  Submitted: {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedTicket.adminReply ? (
                <div className="p-3.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30">
                  <div className="text-[10px] font-mono uppercase text-[#B66DFF] font-bold mb-1 flex items-center gap-1.5">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Engineering Desk Response:
                  </div>
                  <p className="text-white leading-relaxed">{selectedTicket.adminReply}</p>
                  <div className="text-[10px] text-[#C4B5FD] mt-2 font-mono">
                    Status: {selectedTicket.status.toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
                  Your ticket is currently queued with our on-duty quantitative engineers. An update will be posted shortly.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
