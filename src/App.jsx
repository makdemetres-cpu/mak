import { useEffect, useState } from 'react';
import { Preloader } from './components/Preloader';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Story } from './components/Story';
import { SignatureCuts } from './components/SignatureCuts';
import { Menu } from './components/Menu';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Reservation } from './components/Reservation';
import { Location } from './components/Location';
import { Footer } from './components/Footer';
import { ScrollProgress } from './components/ScrollProgress';
import { BackToTop } from './components/BackToTop';
import { CursorDot } from './components/CursorDot';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <>
      <Preloader visible={loading} />
      <ScrollProgress />
      <CursorDot />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Story />
        <SignatureCuts />
        <Menu />
        <Gallery />
        <Testimonials />
        <Reservation />
        <Location />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}

export default App;
