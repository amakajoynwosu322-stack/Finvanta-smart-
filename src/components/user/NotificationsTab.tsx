import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface NotificationsTabProps {
  notifications: NotificationItem[];
  userId: string;
  onRefresh: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  userId,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'all' | 'transaction' | 'investment' | 'system'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    for (const n of notifications) {
      if (!n.read) {
        try {
          await updateDoc(doc(db, 'notifications', n.id), { read: true });
        } catch (e) {
          console.warn(e);
        }
      }
    }
    onRefresh();
  };

  const handleToggleRead = async (item: NotificationItem) => {
    try {
      await updateDoc(doc(db, 'notifications', item.id), { read: !item.read });
      onRefresh();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      onRefresh();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#B66DFF]" />
            In-App Notifications & Protocol Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time updates regarding deposits, yield disbursements, plan maturities, and platform advisories.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171225] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-xs font-semibold text-[#B66DFF] transition-all self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'transaction', label: 'Transactions' },
          { id: 'investment', label: 'Investments' },
          { id: 'system', label: 'System & Security' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === item.id
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#171225]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#171225]/40 border border-dashed border-[#8B5CF6]/20">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-white">No notifications in this filter</h4>
          <p className="text-xs text-slate-400 mt-1">You are completely up to date.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                item.read
                  ? 'bg-[#171225]/60 border-slate-800/80 text-slate-300'
                  : 'bg-gradient-to-r from-[#1E1634] to-[#171225] border-[#8B5CF6]/40 shadow-md shadow-[#8B5CF6]/10 text-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'transaction'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.type === 'investment'
                      ? 'bg-[#8B5CF6]/25 text-[#B66DFF]'
                      : item.type === 'security'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {item.type === 'transaction' && <CreditCard className="w-4 h-4" />}
                  {item.type === 'investment' && <TrendingUp className="w-4 h-4" />}
                  {item.type === 'security' && <Shield className="w-4 h-4" />}
                  {item.type === 'system' && <Info className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold">{item.title}</h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#B66DFF] animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-500 font-mono mt-2 block">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleRead(item)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors text-xs"
                  title={item.read ? 'Mark as unread' : 'Mark as read'}
                >
                  <CheckCheck className={`w-4 h-4 ${item.read ? 'text-slate-600' : 'text-[#B66DFF]'}`} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
