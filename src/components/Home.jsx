import { useEffect } from 'react';
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
            {/* Ordem pensada para a venda: o que é e a tela real; o diferencial (o cliente acompanha);
                o que faz; quem usa; a prova (depoimentos) logo antes do preço; as dúvidas; a chamada. */}
            <main>
                <Placa />
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
