'use client';

import React, { useState, useEffect } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useUser 
} from '@clerk/nextjs';
import { 
  LogIn, 
  User, 
  Key, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  X, 
  ChevronRight,
  LogOut,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ClerkErrorBoundary } from './ClerkErrorBoundary';

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const isClerkAvailable = clerkKey.startsWith('pk_test_') || clerkKey.startsWith('pk_live_');

interface AuthProps {
  onOpenSettings?: () => void;
  onOpenLoginModal?: () => void;
}

export function SidebarUserTile({ onOpenSettings }: AuthProps) {
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('syncink_user');
      if (saved) setLocalUser(JSON.parse(saved));
    } catch (e) {}

    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('syncink_user');
        setLocalUser(saved ? JSON.parse(saved) : null);
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fallbackTile = localUser ? (
    <div
      onClick={onOpenSettings}
      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors border border-transparent hover:border-border"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0">
        {localUser.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">{localUser.name}</p>
        <p className="text-[10px] text-muted truncate">{localUser.plan || 'SyncInk Pro'} · Active</p>
      </div>
    </div>
  ) : (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('syncink:open-auth-modal'));
      }}
      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20 border border-indigo-500/20 text-foreground cursor-pointer transition-all shadow-sm"
    >
      <div className="flex items-center space-x-2">
        <div className="p-1 rounded-lg bg-indigo-500 text-white">
          <LogIn className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold">Sign In / Register</p>
          <p className="text-[10px] text-muted">Real Accounts & Sync</p>
        </div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-muted" />
    </button>
  );

  if (isClerkAvailable) {
    return (
      <ClerkErrorBoundary fallback={fallbackTile}>
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-surface/50 border border-border">
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7 rounded-lg shadow-sm',
                  userButtonPopoverCard: 'bg-surface border border-border shadow-2xl rounded-2xl',
                }
              }}
            />
            <SidebarClerkUserInfo onOpenSettings={onOpenSettings} />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full flex items-center justify-between py-1 text-foreground cursor-pointer group">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white group-hover:scale-105 transition-transform">
                    <LogIn className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold">Sign In</p>
                    <p className="text-[10px] text-muted">Clerk Real Auth</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </ClerkErrorBoundary>
    );
  }

  return fallbackTile;
}

// User Info in Sidebar when using Clerk
function SidebarClerkUserInfo({ onOpenSettings }: AuthProps) {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div 
      onClick={onOpenSettings} 
      className="flex-1 min-w-0 cursor-pointer text-left hover:opacity-80 transition-opacity"
    >
      <p className="text-xs font-semibold text-foreground truncate">
        {user.fullName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'SyncInk User'}
      </p>
      <p className="text-[10px] text-muted truncate">
        {user.primaryEmailAddress?.emailAddress || 'SyncInk Pro'}
      </p>
    </div>
  );
}

// Top Bar Auth Button
export function TopBarAuthButton() {
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('syncink_user');
      if (saved) setLocalUser(JSON.parse(saved));
    } catch (e) {}

    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('syncink_user');
        setLocalUser(saved ? JSON.parse(saved) : null);
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fallbackButton = localUser ? null : (
    <button
      onClick={() => {
        window.dispatchEvent(new CustomEvent('syncink:open-auth-modal'));
      }}
      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm cursor-pointer"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Sign In</span>
    </button>
  );

  if (isClerkAvailable) {
    return (
      <ClerkErrorBoundary fallback={fallbackButton}>
        <SignedIn>
          <div className="flex items-center space-x-2">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7 rounded-lg shadow-sm',
                }
              }}
            />
          </div>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm cursor-pointer">
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </SignInButton>
        </SignedOut>
      </ClerkErrorBoundary>
    );
  }

  return fallbackButton;
}
