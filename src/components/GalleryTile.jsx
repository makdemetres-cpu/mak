import { motion } from 'framer-motion';
import { useTilt } from '../hooks/useTilt';

export function GalleryTile({ label, tone }) {
  const { ref, style, handleMove, handleLeave } = useTilt();

  return (
    <motion.div
      ref={ref}
      className={`gallery-tile gallery-tile--${tone}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
    >
      <div className="gallery-tile__texture" aria-hidden="true" />
      <span className="gallery-tile__label">{label}</span>
    </motion.div>
  );
}
