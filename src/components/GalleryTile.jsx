import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useFinePointer } from '../hooks/useFinePointer';

export function GalleryTile({ label, tone }) {
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

  return (
    <motion.div
      ref={ref}
      className={`gallery-tile gallery-tile--${tone}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={isFine ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
    >
      <div className="gallery-tile__texture" aria-hidden="true" />
      <span className="gallery-tile__label">{label}</span>
    </motion.div>
  );
}
