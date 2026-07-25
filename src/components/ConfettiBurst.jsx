import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const COLORS = ['201, 162, 75', '224, 190, 111', '232, 98, 44', '156, 42, 56', '243, 237, 228'];
const DURATION = 2200;

export function ConfettiBurst() {
  const canvasRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width, height, dpr;
    let rafId;
    const start = performance.now();

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const originX = width / 2;
    const originY = height * 0.55;
    const count = 70;
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 3.4;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.4,
        size: 4 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 120,
      };
    });

    function tick(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      if (elapsed < DURATION) {
        for (const p of particles) {
          const t = elapsed - p.delay;
          if (t < 0) continue;
          const seconds = t / 1000;
          const x = p.x + p.vx * seconds * 24;
          const y = p.y + p.vy * seconds * 24 + 0.5 * 90 * seconds * seconds;
          const life = 1 - t / (DURATION - p.delay);
          if (life <= 0) continue;
          const rotation = p.rotation + p.spin * t * 0.05;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.globalAlpha = Math.max(life, 0);
          ctx.fillStyle = `rgb(${p.color})`;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className="confetti-burst" aria-hidden="true" />;
}
