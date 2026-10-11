import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSection from './HeroSection';
import ProblemSolution from './ProblemSolution';
import CoreFeatures from './CoreFeatures';
import MidCTA from './MidCTA';
import CoManagement from './CoManagement';
import Pricing from './Pricing';
import TestimonialsFaq from './TestimonialsFaq';
import Globe from './Globe';
import useTituloDaPagina from './ajuda/useTituloDaPagina.js';
import { idDaSecao, secaoDaAncora } from '../i18n/idiomas.js';
import { useIdioma } from '../i18n/RotaDoIdioma.jsx';

// Âncora no idioma da página (#precos, #pricing, #precios). Uma âncora de outro idioma
// (link antigo ou compartilhado) é trocada pela deste idioma e a página desce até a seção.
function useAncoraNoIdioma(codigo) {
    const { pathname, search, hash } = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const secao = secaoDaAncora(hash);
        if (!secao) return undefined;
        const certo = idDaSecao(codigo, secao);
        if (decodeURIComponent(hash.slice(1)) !== certo) {
            navigate(`${pathname}${search}#${certo}`, { replace: true });
            return undefined;
        }
        const quadro = requestAnimationFrame(() => document.getElementById(certo)?.scrollIntoView());
        return () => cancelAnimationFrame(quadro);
    }, [codigo, pathname, search, hash, navigate]);
}

export default function Home() {
    const { t } = useTranslation();
    const codigo = useIdioma();
    useTituloDaPagina(t('meta.titulo'), t('meta.descricao'));
    useAncoraNoIdioma(codigo);

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
