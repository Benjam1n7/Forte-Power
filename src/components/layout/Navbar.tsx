import React, { useState } from 'react';
import { ShoppingBag, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { SignalDot } from '../ui/SignalDot';

interface NavbarProps {
  onNavigate: (view: 'shop' | 'builder' | 'calculator' | 'checkout') => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeView }) => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const { user, signInWithGoogle, signOut, isConfigured } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthError(error.message);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5F1E8]/95 backdrop-blur-md border-b border-[#1B1B1A]/15 px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center gap-1.5 text-left group focus-visible:outline-2 focus-visible:outline-[#FF5B35] rounded-lg p-0.5 cursor-pointer"
          aria-label="Forte Power Home"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-display font-extrabold text-2xl tracking-tighter text-[#1B1B1A]">
                FORTE
              </span>
              <SignalDot size="md" pulsing={true} />
            </div>
            <span className="font-mono text-[10px] tracking-[0.25em] font-medium text-[#1B1B1A]/70 uppercase -mt-0.5">
              POWER
            </span>
          </div>
        </button>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono font-medium text-[#1B1B1A]/75">
          <button
            onClick={() => onNavigate('shop')}
            className={`transition-colors hover:text-[#1B1B1A] cursor-pointer ${
              activeView === 'shop' ? 'text-[#1B1B1A] font-bold underline decoration-[#FF5B35] decoration-2 underline-offset-8' : ''
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('builder')}
            className={`transition-colors hover:text-[#1B1B1A] cursor-pointer ${
              activeView === 'builder' ? 'text-[#1B1B1A] font-bold underline decoration-[#FF5B35] decoration-2 underline-offset-8' : ''
            }`}
          >
            3-Step Builder
          </button>
          <button
            onClick={() => onNavigate('calculator')}
            className={`transition-colors hover:text-[#1B1B1A] cursor-pointer ${
              activeView === 'calculator' ? 'text-[#1B1B1A] font-bold underline decoration-[#FF5B35] decoration-2 underline-offset-8' : ''
            }`}
          >
            Cost vs Generator
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3">
          
          {/* User Auth: "Continue with Google" or User Avatar + Name + Sign Out */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 bg-white border border-[#1B1B1A]/20 hover:border-[#1B1B1A] rounded-xl transition-all cursor-pointer shadow-2xs"
                aria-label="User account menu"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-6 h-6 rounded-full object-cover border border-[#1B1B1A]/20"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#1B1B1A] text-[#F5F1E8] font-mono text-xs flex items-center justify-center font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden sm:inline font-sans text-xs font-semibold text-[#1B1B1A] max-w-[120px] truncate">
                  {userName}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#F5F1E8] border border-[#1B1B1A] rounded-2xl shadow-xl p-3 z-50">
                  <div className="pb-2 mb-2 border-b border-[#1B1B1A]/10">
                    <p className="font-semibold text-xs text-[#1B1B1A] truncate">{userName}</p>
                    <p className="font-mono text-[11px] text-[#6E6D68] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-[#1B1B1A] hover:bg-neutral-50 text-[#1B1B1A] rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {authError && (
                <div className="absolute right-0 mt-2 w-72 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl shadow-lg z-50">
                  {authError}
                </div>
              )}
            </div>
          )}

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-[#1B1B1A] text-[#F5F1E8] hover:bg-[#1B1B1A]/90 rounded-xl transition-colors cursor-pointer relative shadow-2xs"
            aria-label={`Open shopping cart with ${totalItemCount} items`}
          >
            <ShoppingBag className="w-4 h-4 text-[#D9FF6B]" />
            <span className="hidden sm:inline font-mono">Cart</span>
            <span className="inline-flex items-center justify-center bg-[#FF5B35] text-white text-[10px] font-mono font-bold w-4 h-4 rounded-full">
              {totalItemCount}
            </span>
          </button>

        </div>
      </div>
    </header>
  );
};
