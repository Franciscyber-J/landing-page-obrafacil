import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Placa from './Placa';
import Cliente from './inicio/Cliente';
import Recursos from './inicio/Recursos';
import Equipe from './inicio/Equipe';
import Depoimentos from './inicio/Depoimentos';
import Precos from './inicio/Precos';
import Perguntas from './inicio/Perguntas';
import Chamada from './inicio/Chamada';
import ExitIntentPopup from './ExitIntentPopup';
import FitaDeObra from './inicio/FitaDeObra';
import { COM_MOVIMENTO, entrarEmGrupo, gsap, jaApareceu, tituloSobe, useGSAP } from '../movimento/index.js';
import useTituloDaPagina from './ajuda/useTituloDaPagina.js';
import { descricaoDaPagina, tituloDaPagina } from '../seo/textos.js';
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
    useTituloDaPagina(tituloDaPagina(t, { tipo: 'inicio' }), descricaoDaPagina(t, { tipo: 'inicio' }));
    useAncoraNoIdioma(codigo);
    const principal = useRef(null);

    // Entradas comuns a todas as seções: a faixa laranja cresce, o título sobe linha por linha, o
    // texto aparece; listas e cartões marcados com data-grupo/data-item entram em sequência.
    useGSAP(() => {
        const mm = gsap.matchMedia();
        mm.add(COM_MOVIMENTO, () => {
            const q = gsap.utils.selector(principal);
            q('.secao-cabeca').forEach((cabeca) => {
                if (jaApareceu(cabeca)) return;
                const gatilho = { trigger: cabeca, start: 'top 85%', once: true };
                gsap.fromTo(cabeca, { '--barra': 0 }, { '--barra': 1, duration: 0.9, ease: 'power3.out', scrollTrigger: gatilho });
                tituloSobe(cabeca.querySelector('.secao-titulo'), { scrollTrigger: gatilho, delay: 0.1 });
                const texto = cabeca.querySelector('.secao-texto');
                if (texto) gsap.from(texto, { y: 24, autoAlpha: 0, delay: 0.35, scrollTrigger: gatilho });
            });
            q('[data-grupo]').forEach((grupo) => entrarEmGrupo(grupo.querySelectorAll('[data-item]'), { gatilho: grupo }));
        });
    }, { scope: principal, dependencies: [codigo], revertOnUpdate: true });

    return (
        <>
            {/* Ordem pensada para a venda: o que é e a tela real; o diferencial (o cliente acompanha);
                o que faz; quem usa; a prova (depoimentos) logo antes do preço; as dúvidas; a chamada. */}
            <main ref={principal}>
                <Placa />
                <FitaDeObra />
                <Cliente />
                <Recursos />
                <Equipe />
                <Depoimentos />
                <Precos />
                <Perguntas />
                <Chamada />
            </main>
            <ExitIntentPopup />
        </>
    );
}
