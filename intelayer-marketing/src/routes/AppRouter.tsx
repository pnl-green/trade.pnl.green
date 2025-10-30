import { useEffect, useMemo } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Contact from '../pages/Contact';
import Docs from '../pages/Docs';
import Home from '../pages/Home';
import LegalPrivacy from '../pages/LegalPrivacy';
import LegalTerms from '../pages/LegalTerms';
import NotFound from '../pages/NotFound';
import Socials from '../pages/Socials';

const AppRouter = () => {
  const prefersReducedMotion = useMemo(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  []);

  useEffect(() => {
    if (prefersReducedMotion) {
      document.body.setAttribute('data-prefers-reduced-motion', 'true');
    }
  }, [prefersReducedMotion]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/docs/*" element={<Docs />} />
        <Route path="/socials" element={<Socials />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal/privacy" element={<LegalPrivacy />} />
        <Route path="/legal/terms" element={<LegalTerms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
