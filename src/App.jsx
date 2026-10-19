import { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './components/Home';
import AjudaPagina from './components/ajuda/AjudaPagina';
import LegalPagina from './components/legal/LegalPagina';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import AvisoCookies from './components/AvisoCookies';
import {
  analisarCaminho, caminhoAjuda, caminhoArtigo, caminhoAssunto, caminhoInicio, caminhoLegal, idioma, secaoDaAncora,
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

// Endereço sem idioma (/, /ajuda/..., /termos-de-uso/ das lojas): vai para o mesmo lugar no idioma da pessoa.
function destinoSemIdioma(lido, hash) {
  if (lido.tipo === 'raiz' || lido.tipo === 'desconhecido') {
    return caminhoInicio(idiomaPreferido(), secaoDaAncora(hash));
  }
  const codigo = lido.codigo ?? idiomaPreferido();
  if (lido.pagina === 'legal') return caminhoLegal(codigo, lido.documento);
  if (lido.pagina === 'assunto') return caminhoAssunto(codigo, lido.modulo);
  if (lido.pagina === 'artigo') return caminhoArtigo(codigo, lido.slug);
  return caminhoAjuda(codigo);
}

function Pagina({ codigo, lido }) {
  if (lido.pagina === 'inicio') return <Home />;
  if (lido.pagina === 'nao-encontrado') return <Navigate to={caminhoInicio(codigo)} replace />;
  if (lido.pagina === 'legal') return <LegalPagina key={`${codigo}:${lido.documento}`} codigo={codigo} documento={lido.documento} />;
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
  const { pathname, search, hash } = useLocation();
  const lido = analisarCaminho(pathname);
  const codigo = lido.tipo === 'pagina' ? lido.codigo : null;
  useIdiomaDoEndereco(codigo ?? idiomaPreferido());

  if (lido.tipo !== 'pagina') return <Navigate to={comConsulta(destinoSemIdioma(lido, hash), search)} replace />;
  if (lido.canonico) return <Navigate to={`${comConsulta(lido.canonico, search)}${hash}`} replace />;

  return (
    <ProvedorDeRota codigo={codigo}>
      <ScrollToTop />
      <Alternativos />
      <AvisoCookies />
      <Navbar />
      <Pagina codigo={codigo} lido={lido} />
      <Footer comChamada={lido.pagina !== 'inicio'} />
      <FloatingWhatsApp />
    </ProvedorDeRota>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="*" element={<Site />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
