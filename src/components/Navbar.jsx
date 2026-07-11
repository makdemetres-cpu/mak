import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './Navbar.css';

const LINKS = [
  { href: '#story', label: 'Our Story' },
  { href: '#menu', label: 'Menu' },
  { href: '#gallery', label: 'Ambiance' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#visit', label: 'Visit' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleNavClick = () => setOpen(false);

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner container">
          <a href="#top" className="navbar__logo" onClick={handleNavClick}>
            PYRA<span className="navbar__logo-dot">.</span>
            <span className="navbar__logo-sub">ATHENS</span>
          </a>

          <nav className="navbar__links" aria-label="Primary">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <a href="#reserve" className="btn btn-ghost navbar__cta">
            Reserve a Table
          </a>

          <button
            className={`navbar__toggle ${open ? 'is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <motion.nav
              className="mobile-menu__links"
              aria-label="Mobile"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
            >
              {LINKS.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={handleNavClick}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="#reserve"
                onClick={handleNavClick}
                className="mobile-menu__cta"
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                Reserve a Table
              </motion.a>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
