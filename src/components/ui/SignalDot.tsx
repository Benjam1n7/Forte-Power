import React from 'react';

interface SignalDotProps {
  size?: 'sm' | 'md' | 'lg';
  pulsing?: boolean;
  className?: string;
}

export const SignalDot: React.FC<SignalDotProps> = ({
  size = 'md',
  pulsing = true,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      aria-label="Power Status Indicator"
    >
      <span
        className={`rounded-full bg-[#FF5B35] ${sizeMap[size]} ${
          pulsing ? 'animate-signal-pulse' : ''
        }`}
      />
    </span>
  );
};
