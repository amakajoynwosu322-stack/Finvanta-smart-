import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { UserProfile } from '../types';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  checkIsAdmin,
  getOrCreateUserProfile,
  seedInitialPlatformData,
  subscribeToUserProfile
} from '../services/db';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  activeViewRole: 'user' | 'admin';
  setActiveViewRole: (role: 'user' | 'admin') => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeViewRole, setActiveViewRole] = useState<'user' | 'admin'>('user');

  // Seed default plans and settings on boot
  useEffect(() => {
    seedInitialPlatformData();
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          // Sync profile in Firestore
          const profile = await getOrCreateUserProfile(
            user.uid,
            user.email || 'user@vortex.capital',
            user.displayName,
            user.photoURL
          );
          setCurrentUser(profile);

          const adminStatus = await checkIsAdmin(user.uid, user.email);
          setIsAdmin(adminStatus || profile.role === 'admin');

          // Listen to live updates to user's balance and state
          unsubscribeProfile = subscribeToUserProfile(user.uid, (updatedProfile) => {
            if (updatedProfile) {
              setCurrentUser(updatedProfile);
            }
          });
        } catch (err) {
          console.error('Error synchronizing user profile:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setFirebaseUser(null);
        // Check if demo user is stored in session
        const demoUser = localStorage.getItem('vortex_demo_session');
        if (demoUser) {
          try {
            const parsed = JSON.parse(demoUser) as UserProfile;
            setCurrentUser(parsed);
            setIsAdmin(parsed.role === 'admin' || parsed.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase());
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      localStorage.removeItem('vortex_demo_session');
      const profile = await getOrCreateUserProfile(
        result.user.uid,
        result.user.email || 'investor@vortex.capital',
        result.user.displayName,
        result.user.photoURL
      );
      setCurrentUser(profile);
      const adminStatus = await checkIsAdmin(result.user.uid, result.user.email);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = async () => {
    setLoading(true);
    const demoUid = 'demo_investor_apex';
    const profile: UserProfile = {
      uid: demoUid,
      email: 'alex.chen@vortex-apex.internal',
      displayName: 'Alex Chen (Quant Investor)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      balance: 14850.0,
      totalInvested: 35000.0,
      totalEarned: 6420.0,
      totalWithdrawn: 4200.0,
      totalDeposited: 47630.0,
      referralCode: 'VX-ALEX88',
      referredBy: '',
      twoFactorEnabled: true,
      status: 'active',
      kycStatus: 'verified',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentUser(profile);
    setIsAdmin(false);
    setActiveViewRole('user');
    localStorage.setItem('vortex_demo_session', JSON.stringify(profile));
    setLoading(false);
  };

  const loginAsDemoAdmin = async () => {
    setLoading(true);
    const adminUid = 'demo_superadmin_apex';
    const profile: UserProfile = {
      uid: adminUid,
      email: BOOTSTRAP_ADMIN_EMAIL,
      displayName: 'Amaka Joy Nwosu (Superadmin)',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      balance: 125000.0,
      totalInvested: 85000.0,
      totalEarned: 24650.0,
      totalWithdrawn: 12000.0,
      totalDeposited: 196650.0,
      referralCode: 'VX-AMAKA1',
      twoFactorEnabled: true,
      status: 'active',
      kycStatus: 'verified',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    setCurrentUser(profile);
    setIsAdmin(true);
    setActiveViewRole('admin');
    localStorage.setItem('vortex_demo_session', JSON.stringify(profile));
    setLoading(false);
  };

  const logout = async () => {
    try {
      localStorage.removeItem('vortex_demo_session');
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
      setActiveViewRole('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshProfile = async () => {
    if (currentUser?.uid && firebaseUser) {
      const p = await getOrCreateUserProfile(
        currentUser.uid,
        currentUser.email,
        currentUser.displayName
      );
      setCurrentUser(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAdmin,
        loginWithGoogle,
        loginAsDemoUser,
        loginAsDemoAdmin,
        logout,
        activeViewRole,
        setActiveViewRole,
        refreshProfile
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
