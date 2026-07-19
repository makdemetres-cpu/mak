import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTilt } from '../hooks/useTilt';

export function DishCard({ name, weight, desc, price, tag }) {
  const { ref, style, handleMove, handleLeave } = useTilt();

  return (
    <motion.article
      ref={ref}
      className="cut-card"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={style}
    >
      <div className="cut-card__top">
        <span className="cut-card__tag">{tag}</span>
        <span className="cut-card__weight">{weight}</span>
      </div>
      <svg className="cut-card__icon" viewBox="0 0 64 64" width="46" aria-hidden="true">
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-gold)" strokeWidth="1" opacity="0.5" />
        <path
          d="M18 32c0-8 6-15 14-15s14 7 14 15-6 15-14 15-14-7-14-15z"
          fill="none"
          stroke="var(--color-ember)"
          strokeWidth="1.2"
        />
      </svg>
      <h3 className="cut-card__name">{name}</h3>
      <p className="cut-card__desc">{desc}</p>
      <div className="cut-card__footer">
        <span className="cut-card__price">{price}</span>
        <Link to="/reserve" state={{ dish: name }} className="btn-text">
          Reserve &rarr;
        </Link>
      </div>
    </motion.article>
  );
}
