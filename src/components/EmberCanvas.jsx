import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function EmberCanvas() {
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

    const isSmall = window.innerWidth < 720;
    const count = isSmall ? 22 : 46;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle(initial) {
      return {
        x: Math.random() * width,
        y: initial ? Math.random() * height : height + 10,
        r: 1 + Math.random() * 2.2,
        speed: 0.12 + Math.random() * 0.28,
        drift: (Math.random() - 0.5) * 0.2,
        alpha: 0.15 + Math.random() * 0.55,
        flicker: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.5 ? '232, 98, 44' : '201, 162, 75',
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: count }, () => makeParticle(true));
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        p.flicker += 0.05;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, `rgba(${p.hue}, ${a})`);
        grad.addColorStop(1, `rgba(${p.hue}, 0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();

        if (p.y < -10) {
          Object.assign(p, makeParticle(false));
        }
      }
      rafId = requestAnimationFrame(step);
    }

    init();
    rafId = requestAnimationFrame(step);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running) rafId = requestAnimationFrame(step);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return <canvas ref={canvasRef} className="ember-canvas" aria-hidden="true" />;
}
