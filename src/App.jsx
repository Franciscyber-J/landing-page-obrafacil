import { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSolution from './components/ProblemSolution';
import CoreFeatures from './components/CoreFeatures';
import CoManagement from './components/CoManagement';
import Pricing from './components/Pricing';
import TestimonialsFaq from './components/TestimonialsFaq';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';

function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <>
      <Navbar onOpenLogin={() => setIsLoginModalOpen(true)} />
      <main>
        <HeroSection />
        <ProblemSolution />
        <CoreFeatures />
        <CoManagement />
        <Pricing />
        <TestimonialsFaq />
      </main>
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}

export default App;
