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
import i18n, { textosProntos } from './i18n/config'
import { cadeia } from './i18n/idiomas.js'
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

// Os textos do idioma da página e de toda a cadeia dele (variante → base → inglês → português) chegaram?
// O i18next segue em frente mesmo quando um arquivo de textos não baixa; aqui isso conta como falha.
function textosCompletos() {
  return cadeia(i18n.language).every((codigo) => i18n.hasResourceBundle(codigo, 'translation'))
}

// Tudo o que a página pronta precisa para ser hidratada. Erro = algo não baixou (rede, robô com pressa).
async function dadosDaPaginaPronta() {
  const dados = lerDados()
  await textosProntos.catch(() => null)
  if (!textosCompletos()) {
    await i18n.reloadResources(cadeia(i18n.language))
    if (!textosCompletos()) throw new Error('textos do idioma não baixaram')
  }
  if (typeof dados.ajuda?.indice === 'string') {
    const resposta = await fetch(dados.ajuda.indice)
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
    dados.ajuda = { ...dados.ajuda, indice: await resposta.json() }
  }
  return dados
}

// Novas tentativas quando os dados da página pronta não baixam (em milissegundos).
const ESPERAS = [2000, 6000, 15000]
const esperar = (ms) => new Promise((pronto) => setTimeout(pronto, ms))

// A página pronta nunca é trocada por um desenho do zero: se os dados dela não baixarem, o texto que veio no HTML
// continua na tela (os links são endereços de verdade e seguem funcionando) e o site tenta de novo; quando a
// internet volta, tenta outra vez. Desenhar do zero aqui dependeria de ler a Central no Firestore, e quem não
// consegue (robô de busca, rede ruim) ficaria com a tela de erro no lugar do artigo que já estava pronto.
async function iniciar() {
  if (!raiz.hasAttribute('data-pronta')) {
    createRoot(raiz).render(arvore)
    return
  }
  let dados = null
  for (let tentativa = 0; !dados; tentativa++) {
    try {
      dados = await dadosDaPaginaPronta()
    } catch {
      if (tentativa >= ESPERAS.length) {
        window.addEventListener('online', iniciar, { once: true })
        return
      }
      await esperar(ESPERAS[tentativa])
    }
  }
  definirDadosIniciais(dados)
  marcarChegadaPronta(jaPintou())
  hydrateRoot(raiz, arvore)
}

iniciar()
