import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  Database,
  Download,
  Globe,
  Lock,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Wallet,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenMobileMenu: () => void;
  unreadNotificationsCount?: number;
  onNavigateTab: (tabId: string) => void;
  onDownloadZip?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenMobileMenu,
  unreadNotificationsCount = 2,
  onNavigateTab,
  onDownloadZip
}) => {
  const {
    currentUser,
    isAdmin,
    logout,
    activeViewRole,
    setActiveViewRole,
    databaseEngine,
    setDatabaseEngine,
    isSupabaseReady
  } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090711]/90 backdrop-blur-xl border-b border-[#8B5CF6]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#171225] lg:hidden transition-colors"
            title="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigateTab('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#4C1D95] flex items-center justify-center shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <div className="absolute inset-0 rounded-xl bg-[#B66DFF] opacity-0 group-hover:opacity-30 blur-sm transition-opacity" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-wider text-white group-hover:text-[#B66DFF] transition-colors">
                  FINVANTA
                </span>
                <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/20 text-[#C4B5FD] border border-[#8B5CF6]/30 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-mono hidden sm:block">
                Nigerian Wealth & Savings Platform
              </p>
            </div>
          </div>
        </div>

        {/* Live Financial Platform Bar */}
        <div className="hidden xl:flex items-center gap-5 px-4 py-1.5 rounded-full bg-[#171225]/80 border border-[#8B5CF6]/15 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-[11px]">CURRENCY:</span>
            <span className="text-emerald-400 font-semibold">Nigerian Naira (₦ / NGN)</span>
          </div>
          <div className="h-3 w-px bg-slate-700/60" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">INSTANT SETTLEMENT:</span>
            <span className="text-white font-medium">Active (Simulated NGN)</span>
          </div>
          <div className="h-3 w-px bg-slate-700/60" />
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#B66DFF]" />
            <span className="text-slate-400 text-[11px]">CENTRAL BACKEND:</span>
            <span className="text-[#B66DFF] font-semibold">Supabase & Database Live</span>
          </div>
        </div>

        {/* Right Action Stack */}
        <div className="flex items-center gap-2.5">
          {/* Download Project ZIP action */}
          {onDownloadZip && (
            <button
              onClick={onDownloadZip}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 hover:border-[#8B5CF6]/70 text-[#C4B5FD] hover:text-white text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="Download Complete FINVANTA Project ZIP Archive"
            >
              <Download className="w-3.5 h-3.5 text-[#B66DFF]" />
              <span>Project ZIP</span>
            </button>
          )}

          {/* Admin Switcher Toggle (if admin) */}
          {isAdmin && (
            <div className="flex items-center bg-[#171225] p-1 rounded-xl border border-[#8B5CF6]/30">
              <button
                onClick={() => {
                  setActiveViewRole('user');
                  onNavigateTab('overview');
                }}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  activeViewRole === 'user'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Investor View
              </button>
              <button
                onClick={() => {
                  setActiveViewRole('admin');
                  onNavigateTab('admin_users');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                  activeViewRole === 'admin'
                    ? 'bg-[#B66DFF] text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-[#B66DFF]'
                }`}
              >
                <Lock className="w-3 h-3" />
                Admin Panel
              </button>
            </div>
          )}

          {/* Quick Balance Pill (Desktop) */}
          {currentUser && (
            <div
              onClick={() => onNavigateTab('available_balance')}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 cursor-pointer hover:border-[#8B5CF6]/60 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center text-[#B66DFF] group-hover:scale-105 transition-transform">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Main Balance
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#B66DFF] transition-colors tabular-nums">
                  ₦{currentUser.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={() => onNavigateTab('notifications')}
            className="relative p-2.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/20 text-slate-300 hover:text-white hover:border-[#8B5CF6]/50 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#B66DFF] text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#090711]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-[#171225] border border-[#8B5CF6]/30 hover:border-[#B66DFF]/50 transition-all"
              >
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                    {currentUser.displayName}
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] bg-[#B66DFF]/20 text-[#B66DFF] font-mono px-1 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                    {currentUser.phoneNumber || currentUser.email}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 flex items-center justify-center text-white font-semibold text-xs">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.displayName.charAt(0).toUpperCase()
                  )}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#171225] border border-[#8B5CF6]/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-slate-800 text-xs">
                      <div className="text-slate-400">Signed in with Phone</div>
                      <div className="font-semibold text-white font-mono truncate">
                        {currentUser.phoneNumber || currentUser.email}
                      </div>
                      <div className="text-[10px] text-[#B66DFF] font-mono mt-0.5">
                        Tier: Apex Titanium
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigateTab('profile');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#8B5CF6]/15 transition-colors text-left"
                      >
                        <User className="w-4 h-4 text-[#8B5CF6]" />
                        User Profile & KYC
                      </button>

                      <button
                        onClick={() => {
                          onNavigateTab('security');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#8B5CF6]/15 transition-colors text-left"
                      >
                        <Shield className="w-4 h-4 text-[#8B5CF6]" />
                        Account Security & 2FA
                      </button>

                      <button
                        onClick={() => {
                          onNavigateTab('support');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-[#8B5CF6]/15 transition-colors text-left"
                      >
                        <Globe className="w-4 h-4 text-[#8B5CF6]" />
                        24/7 Desk Support
                      </button>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect Session
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-semibold shadow-lg shadow-[#8B5CF6]/25 transition-all active:scale-95"
            >
              <User className="w-3.5 h-3.5" />
              Connect Account
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
