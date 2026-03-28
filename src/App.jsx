import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import Home from './components/Home';
import HelpCenter from './components/HelpCenter';
import ExitIntentPopup from './components/ExitIntentPopup';
import FloatingWhatsApp from './components/FloatingWhatsApp';
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ajuda" element={<HelpCenter onOpenLogin={() => setIsLoginModalOpen(true)} />} />
      </Routes>
      <Footer />
      <ExitIntentPopup />
      <FloatingWhatsApp />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </BrowserRouter>
  );
}

export default App;
