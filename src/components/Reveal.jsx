import { motion } from 'framer-motion';

const variants = {
  up: { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  left: { hidden: { opacity: 0, x: -32 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 32 }, show: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } },
};

export function Reveal({
  as: Tag = 'div',
  type = 'up',
  delay = 0,
  duration = 0.7,
  className,
  children,
  ...rest
}) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      className={className}
      variants={variants[type]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function RevealGroup({ as: Tag = 'div', stagger = 0.08, delayChildren = 0, className, children, ...rest }) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren } },
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({ as: Tag = 'div', type = 'up', className, children, ...rest }) {
  const MotionTag = motion[Tag] || motion.div;
  return (
    <MotionTag
      className={className}
      variants={variants[type]}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
