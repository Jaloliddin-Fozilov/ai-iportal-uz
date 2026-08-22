'use client';

import React, { useEffect, useRef } from 'react';

interface AIOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  size = 'lg',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dimensionMap = {
    sm: { width: 36, height: 36, isSmall: true },
    md: { width: 52, height: 52, isSmall: false },
    lg: { width: 130, height: 130, isSmall: false },
    xl: { width: 160, height: 160, isSmall: false },
  };

  const { width, height, isSmall } = dimensionMap[size];

  // Canvas animated fluid plasma & 3D holographic rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Retina display scaling
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const radius = isSmall ? width * 0.44 : width * 0.38;

    const render = () => {
      time += 0.022;
      ctx.clearRect(0, 0, width, height);

      // --- 1. Ambient Outer Glow (Atmospheric dispersion) ---
      if (!isSmall) {
        const ambientGlow = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.35);
        ambientGlow.addColorStop(0, 'rgba(0, 214, 143, 0.28)');
        ambientGlow.addColorStop(0.5, 'rgba(6, 182, 212, 0.18)');
        ambientGlow.addColorStop(0.8, 'rgba(139, 92, 246, 0.12)');
        ambientGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = ambientGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 2. 3D Sphere Deep Shadow & Velvet Body ---
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Deep 3D base gradient (Spherical shading)
      const baseGrad = ctx.createRadialGradient(
        cx - radius * 0.3,
        cy - radius * 0.35,
        radius * 0.05,
        cx,
        cy,
        radius
      );
      baseGrad.addColorStop(0, '#0a2318');
      baseGrad.addColorStop(0.35, '#061a29');
      baseGrad.addColorStop(0.7, '#130c2c');
      baseGrad.addColorStop(1, '#020617');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // --- 3. Fluid 3D Harmonic Plasma Waves (Apple Intelligence / Siri style) ---
      const waveCount = isSmall ? 3 : 5;
      for (let i = 0; i < waveCount; i++) {
        const offset = i * (Math.PI / 2.5);
        const wX = cx + Math.cos(time + offset) * (radius * 0.32);
        const wY = cy + Math.sin(time * 1.2 + offset) * (radius * 0.32);
        const wRadius = radius * (0.55 + Math.sin(time * 0.8 + i) * 0.15);

        const waveGrad = ctx.createRadialGradient(wX, wY, 0, wX, wY, wRadius);
        if (i % 3 === 0) {
          waveGrad.addColorStop(0, 'rgba(0, 214, 143, 0.85)');
          waveGrad.addColorStop(0.6, 'rgba(5, 150, 105, 0.45)');
          waveGrad.addColorStop(1, 'rgba(0, 214, 143, 0)');
        } else if (i % 3 === 1) {
          waveGrad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
          waveGrad.addColorStop(0.6, 'rgba(37, 99, 235, 0.4)');
          waveGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else {
          waveGrad.addColorStop(0, 'rgba(168, 85, 247, 0.85)');
          waveGrad.addColorStop(0.6, 'rgba(236, 72, 153, 0.45)');
          waveGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        }

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = waveGrad;
        ctx.beginPath();
        ctx.arc(wX, wY, wRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- 4. Central Energy Core (Pulsating Fusion Light) ---
      const corePulse = 1 + Math.sin(time * 2.5) * 0.12;
      const coreX = cx + Math.cos(time * 0.7) * (radius * 0.1);
      const coreY = cy + Math.sin(time * 0.9) * (radius * 0.1);
      const coreGrad = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, radius * 0.38 * corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, 'rgba(167, 243, 208, 0.9)');
      coreGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.4)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(coreX, coreY, radius * 0.38 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // --- 5. 3D Glass Fresnel Rim Light & Chromatic Refraction ---
      ctx.globalCompositeOperation = 'source-over';
      const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.78, cx, cy, radius);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rimGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.35)');
      rimGrad.addColorStop(0.88, 'rgba(0, 214, 143, 0.75)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // --- 6. Curved 3D Glass Specular Glint (Gloss Highlight) ---
      const glintGrad = ctx.createRadialGradient(
        cx - radius * 0.42,
        cy - radius * 0.45,
        1,
        cx - radius * 0.42,
        cy - radius * 0.45,
        radius * 0.52
      );
      glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      glintGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.55)');
      glintGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = glintGrad;
      ctx.beginPath();
      ctx.ellipse(
        cx - radius * 0.38,
        cy - radius * 0.42,
        radius * 0.4,
        radius * 0.25,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Bottom-right secondary bounce reflection
      const bounceGrad = ctx.createRadialGradient(
        cx + radius * 0.35,
        cy + radius * 0.4,
        1,
        cx + radius * 0.35,
        cy + radius * 0.4,
        radius * 0.35
      );
      bounceGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      bounceGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.arc(cx + radius * 0.35, cy + radius * 0.4, radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, isSmall]);

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none group ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* 1. Ambient Background Neon Glow */}
      {!isSmall && (
        <>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00d68f]/40 via-[#06b6d4]/30 to-[#8b5cf6]/35 blur-2xl animate-hologram-pulse pointer-events-none" />
          <div className="absolute -inset-3 rounded-full bg-[#00d68f]/20 blur-3xl pointer-events-none" />
        </>
      )}

      {/* 2. 3D Holographic Gyroscope Orbit Ring 1 (Tilted 3D neon ellipse) */}
      {!isSmall && (
        <div 
          className="absolute inset-[-14px] rounded-full pointer-events-none"
          style={{
            perspective: '800px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div 
            className="w-full h-full rounded-full border-[1.5px] border-emerald-400/40 border-t-[#00d68f] border-r-cyan-400 shadow-[0_0_12px_rgba(0,214,143,0.4)] animate-gyro-1"
          />
        </div>
      )}

      {/* 3. 3D Holographic Gyroscope Orbit Ring 2 (Counter-rotated ellipse) */}
      {!isSmall && (
        <div 
          className="absolute inset-[-10px] rounded-full pointer-events-none"
          style={{
            perspective: '800px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div 
            className="w-full h-full rounded-full border-[1.5px] border-purple-400/35 border-b-violet-400 border-l-cyan-300 shadow-[0_0_10px_rgba(168,85,247,0.35)] animate-gyro-2"
          />
        </div>
      )}

      {/* 4. Canvas Renderer */}
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="relative z-10 drop-shadow-[0_12px_24px_rgba(0,214,143,0.25)] rounded-full transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
};
