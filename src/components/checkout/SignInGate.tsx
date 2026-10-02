import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatNaira } from '../../lib/formatters';
import { SignalDot } from '../ui/SignalDot';
import { Lock, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';

interface SignInGateProps {
  onBackToShop: () => void;
}

export const SignInGate: React.FC<SignInGateProps> = ({ onBackToShop }) => {
  const { signInWithGoogle } = useAuth();
  const { items, totalItemCount, totalNaira } = useCart();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <button
        onClick={onBackToShop}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#6E6D68] hover:text-[#1B1B1A] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Storefront</span>
      </button>

      <div className="bg-white border border-[#1B1B1A] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F1E8] border border-[#1B1B1A]/20 flex items-center justify-center mx-auto text-[#1B1B1A]">
            <Lock className="w-5 h-5 text-[#FF5B35]" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#1B1B1A]">
            Sign in to complete checkout
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6D68] max-w-sm mx-auto leading-relaxed">
            Your cart is saved. Sign in with Google to enter your delivery address and receive your order tracking spec sheet.
          </p>
        </div>

        {/* Intact Cart Summary Badge */}
        <div className="p-4 bg-[#F5F1E8] rounded-2xl border border-[#1B1B1A]/15 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1B1B1A] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#2454E6]" />
              <span>Cart Intact ({totalItemCount} items)</span>
            </span>
            <span className="font-mono font-bold text-[#1B1B1A]">
              {formatNaira(totalNaira)}
            </span>
          </div>

          <div className="text-[11px] text-[#6E6D68] flex items-center gap-2 pt-1 border-t border-[#1B1B1A]/10 font-mono">
            <SignalDot size="sm" pulsing={false} />
            <span>Items will remain in your bag after signing in.</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-4 bg-[#1B1B1A] hover:bg-[#1B1B1A]/90 text-[#F5F1E8] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-center text-[11px] text-[#6E6D68]">
            Secured via Supabase Authentication. No third-party passwords stored.
          </p>
        </div>

      </div>
    </div>
  );
};
