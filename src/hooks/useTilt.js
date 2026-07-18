import { useRef } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useFinePointer } from './useFinePointer';

export function useTilt() {
  const ref = useRef(null);
  const isFine = useFinePointer();

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const springX = useSpring(x, { stiffness: 150, damping: 18 });
  const springY = useSpring(y, { stiffness: 150, damping: 18 });
  const rotateX = useTransform(springY, [0, 1], [6, -6]);
  const rotateY = useTransform(springX, [0, 1], [-6, 6]);

  function handleMove(e) {
    if (!isFine || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return {
    ref,
    style: isFine ? { rotateX, rotateY, transformPerspective: 800 } : undefined,
    handleMove,
    handleLeave,
  };
}
