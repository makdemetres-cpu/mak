import { useState } from 'react';

const STAR_PATH = 'M12 2.5l2.95 6.28 6.93.6-5.24 4.6 1.57 6.77L12 17.02l-6.21 3.73 1.57-6.77-5.24-4.6 6.93-.6z';

export function StarRatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="star-input" role="radiogroup" aria-label="Star rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className="star-input__star"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path
              d={STAR_PATH}
              fill={n <= active ? 'var(--color-gold)' : 'transparent'}
              stroke="var(--color-gold)"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
