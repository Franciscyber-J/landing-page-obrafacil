import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/bricolage-grotesque/600.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'
import './index.css'
import { textosProntos } from './i18n/config'
import { definirDadosIniciais } from './dadosIniciais.js'
import { marcarChegadaPronta } from './movimento/index.js'
import App from './App.jsx'

const raiz = document.getElementById('root')
const arvore = (
  <StrictMode>
    <App />
  </StrictMode>
)

function lerDados() {
  try {
    return JSON.parse(document.getElementById('dados-iniciais')?.textContent ?? 'null') ?? {}
  } catch {
    return {}
  }
}

// A página já apareceu na tela antes do JavaScript? (Navegador sem essa medida: considera que sim.)
function jaPintou() {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes('paint')) return true
    return performance.getEntriesByName('first-contentful-paint').length > 0
  } catch {
    return true
  }
}

// Página pronta do build (#root com data-pronta, ferramentas/paginas/gerar.mjs): o texto já está na tela. O site
// espera os textos do idioma e os dados com que ela foi desenhada (o índice da Central vem de /dados/, o mesmo
// arquivo para todas as páginas do idioma) e "hidrata": liga os botões sem desenhar nada de novo.
// Qualquer outra página (endereço sem página pronta, prévia, npm run dev): desenha do zero, como sempre.
async function iniciar() {
  if (!raiz.hasAttribute('data-pronta')) {
    createRoot(raiz).render(arvore)
    return
  }
  const dados = lerDados()
  try {
    await textosProntos
    if (typeof dados.ajuda?.indice === 'string') {
      const resposta = await fetch(dados.ajuda.indice)
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      dados.ajuda = { ...dados.ajuda, indice: await resposta.json() }
    }
  } catch {
    // Sem os dados do build (sem internet no meio do caminho): desenha do zero; a página se refaz sozinha.
    createRoot(raiz).render(arvore)
    return
  }
  definirDadosIniciais(dados)
  marcarChegadaPronta(jaPintou())
  hydrateRoot(raiz, arvore)
}

iniciar()
