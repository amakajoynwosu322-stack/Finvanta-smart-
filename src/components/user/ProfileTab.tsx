import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle,
  Eye,
  FileCheck,
  FileText,
  IdCard,
  Image as ImageIcon,
  Lock,
  Mail,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
  User,
  Wallet,
  X
} from 'lucide-react';
import { UserProfile } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { removeUserProfilePicture, updateUserProfilePicture } from '../../services/db';

interface ProfileTabProps {
  user: UserProfile;
  onRefresh: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, onRefresh }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Profile picture upload & preview state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // KYC state
  const [kycDocType, setKycDocType] = useState<'passport' | 'id_card' | 'drivers_license'>('passport');
  const [docNumber, setDocNumber] = useState('NIN-89314092');
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handle gallery file selection with client-side image compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize/compress on canvas to ensure fast Firestore storage and low latency
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedImagePreview(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Confirm and persist profile picture to Firestore
  const handleConfirmPhotoSave = async () => {
    if (!selectedImagePreview) return;
    try {
      setIsUploadingPhoto(true);
      const res = await updateUserProfilePicture(user.uid, selectedImagePreview);
      if (res.success) {
        showToast(res.message);
        setSelectedImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onRefresh();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Remove profile picture
  const handleRemovePhoto = async () => {
    if (!user.photoURL) return;
    try {
      setIsUploadingPhoto(true);
      const res = await removeUserProfilePicture(user.uid);
      if (res.success) {
        showToast(res.message);
        setSelectedImagePreview(null);
        onRefresh();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove photo.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        updatedAt: new Date().toISOString()
      });
      setSaveSuccess(true);
      showToast('Profile information saved successfully!');
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingKyc(true);
      await updateDoc(doc(db, 'users', user.uid), {
        kycStatus: 'verified',
        updatedAt: new Date().toISOString()
      });
      showToast('KYC document verified successfully! Institutional clearance granted.');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xl backdrop-blur-xl ${
            toastMessage.type === 'success'
              ? 'bg-[#171225]/95 border-[#8B5CF6]/50 text-white'
              : 'bg-rose-950/90 border-rose-600/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B66DFF]" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
          <User className="w-5 h-5 text-[#B66DFF]" />
          Investor Profile & Identity Verification
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal credentials, profile picture, and compliance verification status.
        </p>
      </div>

      {/* Top Profile Summary Badge with Gallery Picture Controls */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 relative overflow-hidden border-[#8B5CF6]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Picture Avatar Container with Camera Badge */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-[#8B5CF6]/25 shrink-0 border-2 border-[#8B5CF6]/40">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>

              {/* Upload Trigger overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-[#8B5CF6] hover:bg-[#B66DFF] text-white shadow-lg border border-[#090711] transition-all hover:scale-110"
                title="Select profile picture from gallery"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-white">{user.displayName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#8B5CF6]/20 text-[#B66DFF] border border-[#8B5CF6]/30">
                  {user.role === 'admin' ? 'ADMINISTRATOR' : 'APEX INVESTOR'}
                </span>
              </div>
              <div className="text-xs text-[#C4B5FD] font-mono mt-0.5">{user.phoneNumber || user.email}</div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span>Ref Code: <strong className="text-white font-mono">{user.referralCode}</strong></span>
                <span>•</span>
                <span>Active Plan: <strong className="text-[#B66DFF] font-mono capitalize">{user.activePlanTier || 'None'}</strong></span>
              </div>
            </div>
          </div>

          {/* Picture Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#171225] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-[#B66DFF]" />
              <span>Choose from Gallery</span>
            </button>
            {user.photoURL && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isUploadingPhoto}
                className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Remove profile picture"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Picture Preview Modal Before Saving */}
      {selectedImagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-[#171225] border border-[#8B5CF6]/40 p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Preview Profile Picture</h3>
            <p className="text-xs text-slate-400 mb-4">
              Confirm your new avatar before saving to your central FINVANTA account profile.
            </p>

            <div className="w-32 h-32 rounded-3xl mx-auto overflow-hidden border-2 border-[#8B5CF6] shadow-xl my-3">
              <img
                src={selectedImagePreview}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setSelectedImagePreview(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPhotoSave}
                disabled={isUploadingPhoto}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9d71fa] hover:to-[#8B5CF6] text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isUploadingPhoto ? 'Saving Picture...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="text-base font-bold text-white tracking-wide mb-1">Account Credentials</h3>
          <p className="text-xs text-slate-400 mb-5">
            Your name and encrypted phone number identity
          </p>

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
                Central identity key used for authentication and OTP authorization.
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
              Simulate uploading Nigerian government identification to verify compliance requirements.
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
                onClick={() => setSimulatedFile('nigerian_nin_identity_slip.pdf')}
                className="p-5 rounded-2xl border-2 border-dashed border-[#8B5CF6]/30 bg-[#090711]/60 text-center cursor-pointer hover:border-[#B66DFF] transition-all group"
              >
                <UploadCloud className="w-8 h-8 text-[#8B5CF6] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">
                  {simulatedFile ? (
                    <span className="text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Attached: {simulatedFile}
                    </span>
                  ) : (
                    'Click to attach specimen document'
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
