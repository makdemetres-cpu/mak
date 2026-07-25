import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOutsideClick } from '../hooks/useOutsideClick';
import './DatePicker.css';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_LABEL = { month: 'long', year: 'numeric' };

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday-first weekday index (0 = Monday … 6 = Sunday)
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseISODate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date(today));

  const wrapperRef = useRef(null);
  useOutsideClick(wrapperRef, open, () => setOpen(false));

  const canGoPrevMonth =
    viewDate.getFullYear() > today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth());

  function changeMonth(delta) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  function selectDay(date) {
    onChange(toISODate(date));
    setOpen(false);
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = mondayIndex(firstOfMonth);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));

  const displayLabel = selected
    ? selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select a date';

  return (
    <div className="date-picker" ref={wrapperRef}>
      <button
        type="button"
        className={`date-picker__trigger ${!selected ? 'date-picker__trigger--placeholder' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{displayLabel}</span>
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <rect x="2.5" y="4" width="15" height="13" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <line x1="2.5" y1="7.5" x2="17.5" y2="7.5" stroke="currentColor" strokeWidth="1.3" />
          <line x1="6" y1="2.5" x2="6" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="14" y1="2.5" x2="14" y2="5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="date-picker__panel"
            role="dialog"
            aria-label="Choose a date"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="date-picker__header">
              <button
                type="button"
                className="date-picker__nav"
                onClick={() => changeMonth(-1)}
                disabled={!canGoPrevMonth}
                aria-label="Previous month"
              >
                &#8249;
              </button>
              <span className="date-picker__month">{viewDate.toLocaleDateString('en-US', MONTH_LABEL)}</span>
              <button type="button" className="date-picker__nav" onClick={() => changeMonth(1)} aria-label="Next month">
                &#8250;
              </button>
            </div>

            <div className="date-picker__weekdays">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="date-picker__grid">
              {cells.map((date, i) => {
                if (!date) return <span key={`blank-${i}`} className="date-picker__cell date-picker__cell--blank" />;
                const isPast = date < today;
                if (isPast) return <span key={date.toISOString()} className="date-picker__cell date-picker__cell--blank" />;

                const isToday = date.getTime() === today.getTime();
                const isSelected = selected && date.getTime() === selected.getTime();

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={`date-picker__cell date-picker__cell--day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => selectDay(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
