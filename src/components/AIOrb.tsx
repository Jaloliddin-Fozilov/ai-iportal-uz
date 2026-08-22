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
    sm: { width: 36, height: 36, isSmall: true, particles: 18 },
    md: { width: 56, height: 56, isSmall: false, particles: 32 },
    lg: { width: 140, height: 140, isSmall: false, particles: 64 },
    xl: { width: 170, height: 170, isSmall: false, particles: 80 },
  };

  const { width, height, isSmall, particles: particleCount } = dimensionMap[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = width * 0.44;

    // Initialize quantum vortex particles
    const particleList: Array<{
      angle: number;
      distance: number;
      speed: number;
      radius: number;
      color: string;
      trailLength: number;
      z: number;
    }> = [];

    const colors = ['#00d68f', '#00f0ff', '#8b5cf6', '#10b981', '#38bdf8', '#ffffff'];

    for (let i = 0; i < particleCount; i++) {
      particleList.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * maxRadius * 0.85 + maxRadius * 0.15,
        speed: (0.015 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
        radius: isSmall ? 0.8 + Math.random() * 0.8 : 1.2 + Math.random() * 1.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        trailLength: 0.15 + Math.random() * 0.25,
        z: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      time += 0.025;
      ctx.clearRect(0, 0, width, height);

      // --- 1. Ambient Background Dark Gateway Portal Backdrop ---
      const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.15);
      bgGlow.addColorStop(0, 'rgba(3, 15, 23, 0.95)');
      bgGlow.addColorStop(0.55, 'rgba(4, 20, 20, 0.75)');
      bgGlow.addColorStop(0.85, 'rgba(0, 214, 143, 0.12)');
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Outer Cybernetic HUD Ticks & Precision Ring ---
      if (!isSmall) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.15);

        // Outer Ring
        ctx.strokeStyle = 'rgba(0, 214, 143, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, maxRadius * 0.96, 0, Math.PI * 2);
        ctx.stroke();

        // 12 Orbital Cyber Tick Marks
        for (let i = 0; i < 12; i++) {
          const tickAngle = (i * Math.PI) / 6;
          const isMajor = i % 3 === 0;
          const innerR = maxRadius * (isMajor ? 0.91 : 0.94);
          const outerR = maxRadius * 0.96;

          ctx.strokeStyle = isMajor ? 'rgba(0, 240, 255, 0.85)' : 'rgba(0, 214, 143, 0.4)';
          ctx.lineWidth = isMajor ? 1.8 : 1;
          ctx.beginPath();
          ctx.moveTo(Math.cos(tickAngle) * innerR, Math.sin(tickAngle) * innerR);
          ctx.lineTo(Math.cos(tickAngle) * outerR, Math.sin(tickAngle) * outerR);
          ctx.stroke();
        }

        // 3 Glowing Orbit Data Nodes
        for (let i = 0; i < 3; i++) {
          const nodeAngle = (i * Math.PI * 2) / 3 + time * 0.4;
          const nx = Math.cos(nodeAngle) * (maxRadius * 0.96);
          const ny = Math.sin(nodeAngle) * (maxRadius * 0.96);

          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      // --- 3. Hexagonal / Dimensional Neural Aperture (iportal Iris) ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-time * 0.25);

      const hexRadius = maxRadius * (isSmall ? 0.88 : 0.76);
      const sides = 6;

      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i * Math.PI * 2) / sides;
        const hx = Math.cos(a) * hexRadius;
        const hy = Math.sin(a) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();

      // Cyber Hex Stroke with Multi-color Neon Gradient
      const hexGrad = ctx.createLinearGradient(-hexRadius, -hexRadius, hexRadius, hexRadius);
      hexGrad.addColorStop(0, '#00d68f');
      hexGrad.addColorStop(0.5, '#00f0ff');
      hexGrad.addColorStop(1, '#8b5cf6');

      ctx.strokeStyle = hexGrad;
      ctx.lineWidth = isSmall ? 1.5 : 2;
      ctx.shadowColor = 'rgba(0, 214, 143, 0.6)';
      ctx.shadowBlur = isSmall ? 4 : 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Fill Dark Singularity Inside Hexagon
      ctx.fillStyle = 'rgba(3, 10, 20, 0.85)';
      ctx.fill();
      ctx.restore();

      // --- 4. 3D Swirling Quantum Vortex Particle Stream ---
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      particleList.forEach((p) => {
        p.angle += p.speed;
        p.z += 0.02;

        // 3D Perspective Projection
        const depth = 0.7 + Math.sin(p.z) * 0.3;
        const currentDistance = p.distance * (0.9 + Math.sin(time + p.angle * 2) * 0.1);
        const px = cx + Math.cos(p.angle) * currentDistance;
        const py = cy + Math.sin(p.angle) * currentDistance * 0.72; // Elliptical 3D tilt

        // Particle Glow Trail
        const trailX = cx + Math.cos(p.angle - p.trailLength * Math.sign(p.speed)) * currentDistance;
        const trailY = cy + Math.sin(p.angle - p.trailLength * Math.sign(p.speed)) * currentDistance * 0.72;

        const trailGrad = ctx.createLinearGradient(trailX, trailY, px, py);
        trailGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        trailGrad.addColorStop(1, p.color);

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = p.radius * depth;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Particle Head
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.radius * depth, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // --- 5. Central Neural Gateway Singularity Core (The iportal Portal) ---
      const corePulse = 1 + Math.sin(time * 3) * 0.18;
      const coreRadius = maxRadius * (isSmall ? 0.32 : 0.28) * corePulse;

      // Inner Event Horizon
      const eventHorizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 1.4);
      eventHorizon.addColorStop(0, '#ffffff');
      eventHorizon.addColorStop(0.35, '#00f0ff');
      eventHorizon.addColorStop(0.7, '#00d68f');
      eventHorizon.addColorStop(1, 'rgba(139, 92, 246, 0)');

      ctx.fillStyle = eventHorizon;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Central Diamond Singularity Crystal
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.8);

      const dSize = coreRadius * 0.65;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -dSize);
      ctx.lineTo(dSize, 0);
      ctx.lineTo(0, dSize);
      ctx.lineTo(-dSize, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height, isSmall, particleCount]);

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none group cursor-pointer ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* 1. Ambient Cyber Aura Glow (Mint & Electric Cyan) */}
      {!isSmall && (
        <>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00d68f]/30 via-[#00f0ff]/25 to-[#8b5cf6]/20 blur-2xl animate-hologram-pulse pointer-events-none" />
          <div className="absolute -inset-2 rounded-full bg-[#00d68f]/15 blur-3xl pointer-events-none" />
        </>
      )}

      {/* 2. Cyber Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="relative z-10 drop-shadow-[0_10px_30px_rgba(0,214,143,0.3)] rounded-full transition-transform duration-300 group-hover:scale-108 active:scale-95"
      />
    </div>
  );
};
