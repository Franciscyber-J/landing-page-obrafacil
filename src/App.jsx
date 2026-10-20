import { Suspense, useEffect } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import AjudaPagina from './components/ajuda/AjudaPagina';
import LegalPagina from './components/legal/LegalPagina';
import PagamentoPagina from './components/conta/PagamentoPagina';
import PerfilPagina from './components/conta/PerfilPagina';
import SuportePagina from './components/conta/SuportePagina';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import AvisoCookies from './components/AvisoCookies';
import {
  analisarCaminho, caminhoDoAntigo, caminhoInicio, consultaQueSegue, idioma, secaoDaAncora,
} from './i18n/idiomas.js';
import { idiomaPreferido } from './i18n/preferencia.js';
import { Alternativos, ProvedorDeRota } from './i18n/RotaDoIdioma.jsx';

// Mantém o que vem depois do endereço (?utm_..., ?gclid=... dos anúncios) ao redirecionar.
function comConsulta(caminho, search) {
  if (!search) return caminho;
  const [antes, ancora] = caminho.split('#');
  return `${antes}${search}${ancora ? `#${ancora}` : ''}`;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// Endereço sem idioma (/, /ajuda/..., /termos-de-uso/ das lojas, /pagamento-ok/ da Stripe, /perfil dos e-mails):
// vai para o mesmo lugar no idioma da pessoa.
function destinoSemIdioma(lido, hash) {
  if (lido.tipo === 'raiz' || lido.tipo === 'desconhecido') {
    return caminhoInicio(idiomaPreferido(), secaoDaAncora(hash));
  }
  return caminhoDoAntigo(lido, lido.codigo ?? idiomaPreferido());
}

function Pagina({ codigo, lido }) {
  // key: a página inicial nasce de novo em cada idioma (as animações de título guardam o texto que dividiram)
  if (lido.pagina === 'inicio') return <Home key={codigo} />;
  if (lido.pagina === 'nao-encontrado') return <Navigate to={caminhoInicio(codigo)} replace />;
  if (lido.pagina === 'legal') return <LegalPagina key={`${codigo}:${lido.documento}`} codigo={codigo} documento={lido.documento} />;
  if (lido.pagina === 'pagamento') return <PagamentoPagina codigo={codigo} compra={lido.compra} />;
  if (lido.pagina === 'perfil') return <PerfilPagina codigo={codigo} />;
  if (lido.pagina === 'suporte') return <SuportePagina codigo={codigo} />;
  return <AjudaPagina key={codigo} codigo={codigo} tipo={lido.pagina === 'ajuda' ? 'inicio' : lido.pagina} modulo={lido.modulo} slug={lido.slug} />;
}

// O idioma do endereço manda: troca os textos do site e o lang/dir da página.
function useIdiomaDoEndereco(codigo) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== codigo) i18n.changeLanguage(codigo);
    const dados = idioma(codigo);
    document.documentElement.lang = codigo;
    document.documentElement.dir = dados?.direcao ?? 'ltr';
  }, [codigo, i18n]);
}

function Site() {
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const lido = analisarCaminho(pathname);
  const codigo = lido.tipo === 'pagina' ? lido.codigo : null;
  useIdiomaDoEndereco(codigo ?? idiomaPreferido());

  if (lido.tipo !== 'pagina') {
    return <Navigate to={comConsulta(destinoSemIdioma(lido, hash), consultaQueSegue(lido, search))} replace />;
  }
  if (lido.canonico) return <Navigate to={`${comConsulta(lido.canonico, search)}${hash}`} replace />;

  return (
    <ProvedorDeRota codigo={codigo}>
      <ScrollToTop />
      <Alternativos />
      <AvisoCookies />
      <Navbar />
      {/* Só depois de os textos do idioma chegarem: a página não nasce com os textos do idioma anterior. */}
      {i18n.language === codigo && <Pagina codigo={codigo} lido={lido} />}
      {/* A chamada "Começar grátis" do rodapé não aparece para quem já é cliente (volta do pagamento e Perfil). */}
      <Footer comChamada={!['inicio', 'pagamento', 'perfil'].includes(lido.pagina)} />
      <FloatingWhatsApp />
    </ProvedorDeRota>
  );
}

// Prévia (VITE_PREVIA=sim): a página roda fora da raiz do domínio, então o endereço fica na memória
// e começa na página inicial em português. No site de verdade é sempre o BrowserRouter.
const PREVIA = import.meta.env.VITE_PREVIA === 'sim';
function Roteador({ children }) {
  if (PREVIA) return <MemoryRouter initialEntries={['/pt-br/']}>{children}</MemoryRouter>;
  return <BrowserRouter>{children}</BrowserRouter>;
}

function App() {
  return (
    <Roteador>
      <Suspense fallback={null}>
        <Routes>
          <Route path="*" element={<Site />} />
        </Routes>
      </Suspense>
    </Roteador>
  );
}

export default App;
