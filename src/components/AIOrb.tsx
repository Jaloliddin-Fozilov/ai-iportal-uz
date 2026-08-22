'use client';

import React from 'react';

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  glow?: boolean;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  size = 'lg',
  className = '',
  glow = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
    xl: 'w-32 h-32',
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative flex items-center justify-center select-none ${sizeMap[size]} ${className}`}>
      {/* 1. Ambient Holographic Glow Aura */}
      {glow && (
        <>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00d68f]/40 via-[#06b6d4]/30 to-[#8b5cf6]/35 blur-xl animate-hologram-pulse" />
          <div className="absolute -inset-2 rounded-full bg-[#00d68f]/20 blur-2xl animate-pulse" />
        </>
      )}

      {/* 2. Outer Rotating Cosmic Wave Ring 1 */}
      {!isSmall && (
        <div className="absolute inset-0 rounded-full border border-emerald-400/35 border-t-cyan-400 border-r-purple-400/60 animate-spin-slow pointer-events-none" />
      )}

      {/* 3. Outer Rotating Elliptical Wave Ring 2 */}
      {!isSmall && (
        <div className="absolute -inset-1 rounded-full border border-cyan-400/25 border-b-emerald-400 border-l-violet-400/40 animate-spin-reverse pointer-events-none" />
      )}

      {/* 4. Morphing 3D Iridescent Sphere Canvas */}
      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl p-[1.5px] bg-gradient-to-br from-[#00d68f] via-[#06b6d4] to-[#8b5cf6]">
        {/* Core Sphere Surface */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-tr from-[#002d20] via-[#02182b] to-[#120826] flex items-center justify-center">
          {/* Fluid Iridescent Gradient Layers */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00d68f]/80 via-[#06b6d4]/70 to-[#a855f7]/80 mix-blend-screen animate-orb-fluid" />

          {/* Morphing Neon Wave Blobs (Apple Intelligence / Dribbble Style) */}
          <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] rounded-[40%] bg-gradient-to-br from-emerald-400 via-teal-300 to-indigo-500 opacity-70 blur-xs animate-wave-morph mix-blend-overlay" />
          
          <div className="absolute -bottom-1/4 -right-1/4 w-[140%] h-[140%] rounded-[45%] bg-gradient-to-tl from-purple-500 via-pink-400 to-cyan-300 opacity-60 blur-xs animate-wave-morph-reverse mix-blend-color-dodge" />

          {/* Specular 3D Glass Light Glint (Top Left highlight) */}
          <div className="absolute top-1 left-2 w-2/5 h-2/5 rounded-full bg-gradient-to-br from-white/80 via-white/20 to-transparent blur-[1px] pointer-events-none" />

          {/* Inner Light Core */}
          <div className="w-1/3 h-1/3 rounded-full bg-white/40 blur-sm animate-pulse pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
