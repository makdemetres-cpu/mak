import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOutsideClick } from '../hooks/useOutsideClick';
import './TimePicker.css';

const START_MINUTES = 12 * 60;
const END_MINUTES = 23 * 60 + 30;
const STEP = 30;

const TIME_OPTIONS = [];
for (let m = START_MINUTES; m <= END_MINUTES; m += STEP) {
  const hour = Math.floor(m / 60);
  const minute = m % 60;
  TIME_OPTIONS.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
}

function formatTime(value) {
  const [hour, minute] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, open, () => setOpen(false));

  function select(option) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div className="time-picker" ref={wrapperRef}>
      <button
        type="button"
        className={`time-picker__trigger ${!value ? 'time-picker__trigger--placeholder' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value ? formatTime(value) : 'Select a time'}</span>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10 6v4l3 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="time-picker__panel"
            role="listbox"
            aria-label="Choose a time"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {TIME_OPTIONS.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option}
                  className={`time-picker__option ${value === option ? 'is-selected' : ''}`}
                  onClick={() => select(option)}
                >
                  {formatTime(option)}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
