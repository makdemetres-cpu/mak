import { AnimatePresence, motion } from 'framer-motion';
import './Preloader.css';

export function Preloader({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="preloader"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }}
          aria-hidden="true"
        >
          <div className="preloader__mark">
            <svg viewBox="0 0 120 120" width="72" height="72" fill="none">
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 6"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '60px 60px' }}
              />
              <motion.path
                d="M60 30 C48 42 42 54 42 66 C42 80 50 90 60 90 C70 90 78 80 78 66 C78 54 72 42 60 30 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
          </div>
          <motion.p
            className="preloader__label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            PYRA
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
