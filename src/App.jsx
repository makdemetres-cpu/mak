import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Preloader } from './components/Preloader';
import { ScrollProgress } from './components/ScrollProgress';
import { BackToTop } from './components/BackToTop';
import { EmberCursorTrail } from './components/EmberCursorTrail';
import { ScrollToTop } from './components/ScrollToTop';
import { Home } from './pages/Home';
import { ReservationPage } from './pages/ReservationPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MenuPage } from './pages/MenuPage';
import { VisitPage } from './pages/VisitPage';
import { ReviewPage } from './pages/ReviewPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { ConsentProvider } from './consent/ConsentContext';
import { useConsent } from './consent/useConsent';
import { FontLoader } from './consent/FontLoader';
import { CookieBanner } from './components/cookies/CookieBanner';
import { CookiePreferencesModal } from './components/cookies/CookiePreferencesModal';

function AppShell() {
  const [loading, setLoading] = useState(true);
  const { awaitingDecision } = useConsent();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  // Scrolling stays locked while the preloader is up AND while the visitor
  // hasn't made a cookie choice yet (covers the banner and the preferences
  // panel, since either one can be open during that window).
  useEffect(() => {
    document.body.style.overflow = loading || awaitingDecision ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading, awaitingDecision]);

  return (
    <>
      <FontLoader />
      <Preloader visible={loading} />
      <ScrollProgress />
      <EmberCursorTrail />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/visit" element={<VisitPage />} />
        <Route path="/reserve" element={<ReservationPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/cookies" element={<CookiePolicyPage />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <BackToTop />
      {!loading && <CookieBanner />}
      <CookiePreferencesModal />
    </>
  );
}

function App() {
  return (
    <ConsentProvider>
      <AppShell />
    </ConsentProvider>
  );
}

export default App;
