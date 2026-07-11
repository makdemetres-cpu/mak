import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useFinePointer } from '../hooks/useFinePointer';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './CursorDot.css';

export function CursorDot() {
  const isFine = useFinePointer();
  const reducedMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40 });
  const springY = useSpring(y, { stiffness: 500, damping: 40 });

  useEffect(() => {
    if (!isFine || reducedMotion) return;
    const handleMove = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isFine, reducedMotion, x, y]);

  if (!isFine || reducedMotion) return null;

  return (
    <motion.div
      className="cursor-dot"
      style={{ translateX: springX, translateY: springY }}
      aria-hidden="true"
    />
  );
}
