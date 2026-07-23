import { motion } from 'framer-motion';
import { useTilt } from '../hooks/useTilt';

export function GalleryTile({ label, tone, image }) {
  const { ref, style, handleMove, handleLeave } = useTilt();

  return (
    <motion.div
      ref={ref}
      className={`gallery-tile ${image ? 'gallery-tile--photo' : `gallery-tile--${tone}`}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
    >
      {image ? (
        <div className="gallery-tile__photo" style={{ backgroundImage: `url(${image})` }} aria-hidden="true" />
      ) : (
        <div className="gallery-tile__texture" aria-hidden="true" />
      )}
      <span className="gallery-tile__label">{label}</span>
    </motion.div>
  );
}
