import React from 'react';

export function LogoIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img 
      src="/icon.png" 
      alt="Evo+ Icon" 
      className={`object-contain ${className}`}
    />
  );
}

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <img 
      src="/logo.png" 
      alt="Evo+ Logo" 
      className={`object-contain ${className}`}
    />
  );
}
