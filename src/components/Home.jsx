import HeroSection from './HeroSection';
import ProblemSolution from './ProblemSolution';
import CoreFeatures from './CoreFeatures';
import MidCTA from './MidCTA';
import CoManagement from './CoManagement';
import Pricing from './Pricing';
import TestimonialsFaq from './TestimonialsFaq';
import Globe from './Globe';

export default function Home() {
    return (
        <>
            <Globe />
            <main style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
                <HeroSection />
                <ProblemSolution />
                <CoreFeatures />
                <MidCTA />
                <CoManagement />
                <Pricing />
                <TestimonialsFaq />
            </main>
        </>
    );
}
