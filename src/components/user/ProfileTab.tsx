import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  FileCheck,
  FileText,
  IdCard,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
  Wallet
} from 'lucide-react';
import { UserProfile } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface ProfileTabProps {
  user: UserProfile;
  onRefresh: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, onRefresh }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // KYC state
  const [kycDocType, setKycDocType] = useState<'passport' | 'id_card' | 'drivers_license'>('passport');
  const [docNumber, setDocNumber] = useState('P-9842109');
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycToast, setKycToast] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        photoURL,
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingKyc(true);
      // Simulate verification review
      await updateDoc(doc(db, 'users', user.uid), {
        kycStatus: 'verified',
        updatedAt: new Date().toISOString()
      });
      setKycToast('KYC document verified successfully! Institutional limits unlocked.');
      setTimeout(() => setKycToast(null), 4000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {kycToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{kycToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <User className="w-5 h-5 text-[#B66DFF]" />
          Investor Profile & Identity Verification (KYC)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal credentials, contact telemetry, and compliance clearance status.
        </p>
      </div>

      {/* Top Profile Summary Badge */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 relative overflow-hidden border-[#8B5CF6]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-[#8B5CF6]/25 shrink-0 border border-[#8B5CF6]/40">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                user.displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{user.displayName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8B5CF6]/20 text-[#B66DFF] border border-[#8B5CF6]/30">
                  APEX TITANIUM
                </span>
              </div>
              <div className="text-xs text-[#C4B5FD] font-mono mt-0.5">{user.phoneNumber || user.email}</div>
              <div className="flex items-center gap-2 mt-2 text-[11px]">
                <span className="text-slate-500">UID: {user.uid.slice(0, 10)}...</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* KYC Status Pill */}
          <div className="p-4 rounded-2xl bg-[#090711]/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">KYC Compliance</div>
              <div className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                {user.kycStatus || 'Unverified'}
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">Account Credentials</h3>
          <p className="text-xs text-slate-400 mb-5">Update your visual appearance and display moniker</p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#B66DFF]"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={photoURL}
                placeholder="https://..."
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono focus:outline-none focus:border-[#B66DFF]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">First Name</label>
                <input
                  type="text"
                  disabled
                  value={user.firstName || user.displayName.split(' ')[0] || ''}
                  className="w-full bg-[#090711]/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-300 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Last Name</label>
                <input
                  type="text"
                  disabled
                  value={user.lastName || user.displayName.split(' ').slice(1).join(' ') || ''}
                  className="w-full bg-[#090711]/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-300 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1.5 font-medium">Primary Phone Number (Auth)</label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={user.phoneNumber || user.email || 'Unspecified'}
                  className="w-full bg-[#090711]/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white font-mono cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Primary identifier for login and cryptographic OTP password recovery.
              </span>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 text-xs font-semibold text-center">
                Profile updated successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* KYC Verification Simulator */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white tracking-wide">Identity Clearance (KYC)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase">
                {user.kycStatus === 'verified' ? 'TIER 2 VERIFIED' : 'PENDING'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Simulate uploading government identification to satisfy institutional compliance requirements.
            </p>

            <form onSubmit={handleSimulateKycSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Document Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'passport', label: 'Passport' },
                    { id: 'id_card', label: 'National ID' },
                    { id: 'drivers_license', label: 'License' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setKycDocType(d.id as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        kycDocType === d.id
                          ? 'bg-[#8B5CF6]/20 border-[#B66DFF] text-white'
                          : 'bg-[#090711] border-slate-800 text-slate-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">Document Serial Number</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-[#090711] border border-[#8B5CF6]/30 rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-[#B66DFF]"
                />
              </div>

              {/* Upload Dropzone simulation */}
              <div
                onClick={() => setSimulatedFile('document_id_scanned_specimen.pdf')}
                className="p-5 rounded-2xl border-2 border-dashed border-[#8B5CF6]/30 bg-[#090711]/60 text-center cursor-pointer hover:border-[#B66DFF] transition-all group"
              >
                <UploadCloud className="w-8 h-8 text-[#8B5CF6] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">
                  {simulatedFile ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Attached: {simulatedFile}
                    </span>
                  ) : (
                    'Click to attach simulated specimen document'
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">PDF, PNG, or JPG (max 10MB)</div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingKyc}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {isSubmittingKyc ? 'Verifying Specimen...' : 'Submit Specimen for Instant Verification'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
