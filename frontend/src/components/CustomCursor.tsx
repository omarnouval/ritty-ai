'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastPosRef = useRef({ x: 0, y: 0 });
  const lastSpawnRef = useRef(0);

  // Particle spawn on move
  const spawnParticles = useCallback((x: number, y: number) => {
    const now = Date.now();
    // Throttle spawn rate (every ~16ms = ~60fps worth)
    if (now - lastSpawnRef.current < 16) return;
    lastSpawnRef.current = now;

    const count = 2 + Math.floor(Math.random() * 2); // 2-3 particles per tick
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.8;
      const maxLife = 30 + Math.floor(Math.random() * 30); // 30-60 frames
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        size: 3 + Math.random() * 6,
        alpha: 0.4 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3, // slight upward drift (smoke rises)
        life: maxLife,
        maxLife,
      });
    }

    // Cap particles (performance)
    if (particlesRef.current.length > 120) {
      particlesRef.current = particlesRef.current.slice(-80);
    }
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.size += 0.15; // expand = smoke effect
        p.alpha = Math.max(0, (p.life / p.maxLife) * 0.5); // fade out
        p.vx *= 0.98; // decelerate
        p.vy *= 0.98;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Green smoke glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(64, 255, 175, ${p.alpha})`;
        ctx.fill();

        // Outer glow (softer, bigger)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(64, 255, 175, ${p.alpha * 0.2})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Detect movement (distance threshold)
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        setIsMoving(true);
        spawnParticles(e.clientX, e.clientY);
        clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = setTimeout(() => setIsMoving(false), 100);
      }

      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsMoving(false);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('hoverable')
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => setIsHovering(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      clearTimeout(moveTimeoutRef.current);
    };
  }, [spawnParticles]);

  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      {/* Particle canvas — behind cursor elements */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 99998,
        }}
      />
      {/* Outer ring */}
      <div
        className="custom-cursor"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          opacity: isVisible ? 1 : 0,
          width: isHovering ? '50px' : '20px',
          height: isHovering ? '50px' : '20px',
          borderColor: isHovering ? '#fff' : '#40FFAF',
          background: isHovering ? 'rgba(64, 255, 175, 0.1)' : 'transparent',
          boxShadow: isMoving
            ? '0 0 12px rgba(64, 255, 175, 0.4), 0 0 30px rgba(64, 255, 175, 0.15)'
            : '0 0 8px rgba(64, 255, 175, 0.2)',
          transition: 'width 0.2s, height 0.2s, border-color 0.2s, box-shadow 0.3s',
        }}
      />
      {/* Inner dot */}
      <div
        className="cursor-dot"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          opacity: isVisible ? 1 : 0,
          boxShadow: isMoving
            ? '0 0 8px rgba(64, 255, 175, 0.6)'
            : '0 0 4px rgba(64, 255, 175, 0.3)',
        }}
      />
    </>
  );
}
