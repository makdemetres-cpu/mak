import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './EmberCursorTrail.css';

const HUES = ['232, 98, 44', '201, 162, 75', '156, 42, 56'];

export function EmberCursorTrail() {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    let particles = [];
    let rafId;
    let running = true;
    let lastSpawn = 0;
    let lastX = null;
    let lastY = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(x, y) {
      const count = 2;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          r: 1.5 + Math.random() * 2,
          vy: -(0.4 + Math.random() * 0.5),
          vx: (Math.random() - 0.5) * 0.6,
          life: 0,
          maxLife: 500 + Math.random() * 400,
          hue: HUES[Math.floor(Math.random() * HUES.length)],
        });
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90);
    }

    function handlePointerMove(e) {
      const now = performance.now();
      const x = e.clientX;
      const y = e.clientY;

      if (lastX !== null) {
        const dist = Math.hypot(x - lastX, y - lastY);
        if (dist < 3) return;
      }
      lastX = x;
      lastY = y;

      if (now - lastSpawn < 30) return;
      lastSpawn = now;
      spawn(x, y);
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      particles = particles.filter((p) => p.life < p.maxLife);
      for (const p of particles) {
        p.life += 16;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.002;
        const t = p.life / p.maxLife;
        const alpha = (1 - t) * 0.7;
        const radius = p.r * (1 - t * 0.4);

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
        grad.addColorStop(0, `rgba(${p.hue}, ${alpha})`);
        grad.addColorStop(1, `rgba(${p.hue}, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    resize();
    rafId = requestAnimationFrame(step);

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) rafId = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className="ember-cursor-trail" aria-hidden="true" />;
}
