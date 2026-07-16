import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Preloader } from './components/Preloader';
import { ScrollProgress } from './components/ScrollProgress';
import { BackToTop } from './components/BackToTop';
import { CursorDot } from './components/CursorDot';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { ReservationPage } from './pages/ReservationPage';

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
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <BackToTop />
    </>
  );
}

export default App;
