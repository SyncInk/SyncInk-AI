'use client';

import React, { useState, useEffect } from 'react';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
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

const isClerkAvailable = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface AuthProps {
  onOpenSettings?: () => void;
}

// User Tile in Sidebar Footer
export function SidebarUserTile({ onOpenSettings }: AuthProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  if (isClerkAvailable) {
    return (
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
    );
  }

  // Fallback when Clerk keys are being added to Vercel
  return (
    <>
      <button
        onClick={() => setIsGuideOpen(true)}
        className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-500/20 border border-indigo-500/25 text-foreground cursor-pointer transition-all shadow-sm group"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Key className="w-3.5 h-3.5" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold truncate flex items-center space-x-1">
              <span>Connect Clerk</span>
              <span className="text-[9px] px-1 rounded bg-indigo-500/20 text-indigo-400 font-bold">PRO</span>
            </p>
            <p className="text-[10px] text-muted truncate">Real OAuth & Passwords</p>
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Clerk Activation Guide Dialog */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface/95 dark:bg-[#0c0e17]/95 border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 relative animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setIsGuideOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-muted hover:text-foreground rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Real Clerk Authentication</h3>
                <p className="text-xs text-muted">Ready for 100% real Google, Discord & Email login</p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              The real <strong>Clerk Auth Engine</strong> is already installed in the codebase! To enable live user logins on your Vercel deployment:
            </p>

            <div className="space-y-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-surface border border-border">
                <p className="font-semibold text-foreground mb-1">1. Get your free Clerk API keys</p>
                <p className="text-muted text-[11px] mb-2">
                  Sign up for free at Clerk (10,000 active users free):
                </p>
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                >
                  <span>Open Clerk Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border">
                <p className="font-semibold text-foreground mb-1">2. Add to Vercel Environment Variables</p>
                <p className="text-muted text-[11px] leading-relaxed">
                  In your <strong>Vercel Dashboard → Settings → Environment Variables</strong>, add:
                </p>
                <div className="mt-2 space-y-1 font-mono text-[10px] text-indigo-300 bg-black/30 p-2 rounded-lg">
                  <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</div>
                  <div>CLERK_SECRET_KEY</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsGuideOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              Got It, Continue to App
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// User Info in Sidebar
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
  if (isClerkAvailable) {
    return (
      <>
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
      </>
    );
  }

  return null;
}
