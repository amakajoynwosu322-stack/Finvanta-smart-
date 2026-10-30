/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase/client';
import { PhoneLoginData, PhoneRegistrationData, UserProfile } from '../types';
import {
  BOOTSTRAP_ADMIN_PHONE,
  checkIsAdmin,
  getUserProfile,
  loginUserWithPhone,
  registerUserWithPhone,
  requestPhoneResetOtp,
  seedInitialPlatformData,
  subscribeToUserProfile,
  verifyPhoneResetOtpAndSetPassword
} from '../services/db';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (phoneNumber: string, password: string, countryCode?: string) => Promise<UserProfile>;
  register: (data: PhoneRegistrationData) => Promise<UserProfile>;
  requestOtp: (phoneNumber: string, countryCode?: string) => Promise<{ resetId: string; otpCode: string; phoneNumber: string }>;
  resetPasswordWithOtp: (resetId: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  activeViewRole: 'user' | 'admin';
  setActiveViewRole: (role: 'user' | 'admin') => void;
  refreshProfile: () => Promise<void>;
  databaseEngine: 'firebase' | 'supabase';
  setDatabaseEngine: (engine: 'firebase' | 'supabase') => void;
  isSupabaseReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'finvanta_auth_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeViewRole, setActiveViewRole] = useState<'user' | 'admin'>('user');
  const [databaseEngine, setDatabaseEngine] = useState<'firebase' | 'supabase'>('firebase');
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(isSupabaseConfigured);

  // Initialize central database seeds (default plans, platform configuration, root admin account)
  useEffect(() => {
    seedInitialPlatformData();
    setIsSupabaseReady(isSupabaseConfigured);
  }, []);

  // Restore authenticated session from central server using stored session token
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const restoreSession = async () => {
      try {
        const storedUid =
          sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);

        if (storedUid) {
          // Fetch authoritative profile directly from the central database
          const profile = await getUserProfile(storedUid);
          if (profile && profile.status === 'active') {
            setCurrentUser(profile);
            const adminStatus = await checkIsAdmin(profile.uid, profile.phoneNumber);
            setIsAdmin(adminStatus || profile.role === 'admin');

            // Subscribe to live authoritative updates (balance, investments, KYC)
            unsubscribeProfile = subscribeToUserProfile(profile.uid, (updated) => {
              if (updated) {
                setCurrentUser(updated);
              }
            });
          } else {
            // Invalid or suspended session
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(SESSION_KEY);
            setCurrentUser(null);
            setIsAdmin(false);
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Login with phone number and password
  const login = async (phoneNumber: string, password: string, countryCode = '+234'): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await loginUserWithPhone(phoneNumber, password, countryCode);

      // Persist session identifier across reloads (authoritative data is always fetched from server)
      sessionStorage.setItem(SESSION_KEY, profile.uid);
      localStorage.setItem(SESSION_KEY, profile.uid);

      setCurrentUser(profile);
      const adminStatus = await checkIsAdmin(profile.uid, profile.phoneNumber);
      setIsAdmin(adminStatus || profile.role === 'admin');

      if (adminStatus || profile.role === 'admin') {
        setActiveViewRole('admin');
      } else {
        setActiveViewRole('user');
      }

      // Sync with Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signInWithPassword({
            phone: profile.phoneNumber,
            password
          });
        } catch {
          // Supabase sync fallback
        }
      }

      return profile;
    } finally {
      setLoading(false);
    }
  };

  // Register new account with phone number and password
  const register = async (data: PhoneRegistrationData): Promise<UserProfile> => {
    setLoading(true);
    try {
      const profile = await registerUserWithPhone(data);

      // Persist session identifier
      sessionStorage.setItem(SESSION_KEY, profile.uid);
      localStorage.setItem(SESSION_KEY, profile.uid);

      setCurrentUser(profile);
      setIsAdmin(false);
      setActiveViewRole('user');

      // Sync with Supabase Auth if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.auth.signUp({
            phone: profile.phoneNumber,
            password: data.password,
            options: {
              data: {
                first_name: data.firstName,
                last_name: data.lastName,
                phone: profile.phoneNumber
              }
            }
          });
        } catch {
          // Supabase sync fallback
        }
      }

      return profile;
    } finally {
      setLoading(false);
    }
  };

  // Request password reset OTP
  const requestOtp = async (phoneNumber: string, countryCode = '+234') => {
    return await requestPhoneResetOtp(phoneNumber, countryCode);
  };

  // Reset password using verified OTP
  const resetPasswordWithOtp = async (resetId: string, otp: string, newPassword: string) => {
    return await verifyPhoneResetOtpAndSetPassword(resetId, otp, newPassword);
  };

  // Logout
  const logout = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('finvanta_demo_session');
    setCurrentUser(null);
    setIsAdmin(false);
    setActiveViewRole('user');
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // no-op
      }
    }
  };

  // Refresh profile from central database
  const refreshProfile = async () => {
    if (currentUser?.uid) {
      const fresh = await getUserProfile(currentUser.uid);
      if (fresh) {
        setCurrentUser(fresh);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAdmin,
        login,
        register,
        requestOtp,
        resetPasswordWithOtp,
        logout,
        activeViewRole,
        setActiveViewRole,
        refreshProfile,
        databaseEngine,
        setDatabaseEngine,
        isSupabaseReady
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
