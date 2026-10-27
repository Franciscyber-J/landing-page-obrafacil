import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { IDIOMAS } from './src/i18n/registro.js'
import { moduloDasFontes } from './src/fontes/escritas.js'

// Central de Ajuda em desenvolvimento, sem tocar no Firestore:
//   1. No gestao_obras, gere os documentos:  node bin/publicar.mjs --saida D:\Projetos\ajuda_saida
//   2. Aqui:  $env:AJUDA_SAIDA = "D:\Projetos\ajuda_saida"; npm run dev
// Opcional: $env:AJUDA_PRINTS = pasta com <idioma>/<id do artigo>/<arquivo> dos prints.
// Só vale para "npm run dev". O build de produção sempre lê o Firestore.
const IDIOMA = /^[a-z]{2}-[A-Z]{2}$/
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ARQUIVO_PRINT = /^[a-z0-9][a-z0-9-]{0,60}\.(png|webp|jpg)$/
const TIPOS = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg' }

function ajudaLocal() {
  const saida = process.env.AJUDA_SAIDA ? path.resolve(process.env.AJUDA_SAIDA) : null
  const prints = process.env.AJUDA_PRINTS ? path.resolve(process.env.AJUDA_PRINTS) : null
  return {
    name: 'ajuda-local',
    apply: 'serve',
    config() {
      const define = {}
      if (saida) define['import.meta.env.VITE_AJUDA_LOCAL'] = JSON.stringify('sim')
      if (prints) define['import.meta.env.VITE_AJUDA_PRINTS_LOCAIS'] = JSON.stringify('sim')
      return { define }
    },
    configureServer(server) {
      if (saida) server.config.logger.info(`  Central de Ajuda: lendo ${saida}`)
      server.middlewares.use('/__ajuda', (req, res, next) => {
        const partes = decodeURIComponent((req.url ?? '').split('?')[0]).split('/').filter(Boolean)
        let arquivo = null
        let tipo = 'application/json; charset=utf-8'
        if (saida && partes.length === 2 && partes[0] === 'ajuda_indices') {
          const nome = partes[1].replace(/\.json$/, '')
          if (IDIOMA.test(nome)) arquivo = path.join(saida, 'ajuda_indices', `${nome}.json`)
        } else if (saida && partes.length === 2 && partes[0] === 'ajuda_artigos') {
          const nome = partes[1].replace(/\.json$/, '')
          if (ID.test(nome)) arquivo = path.join(saida, 'ajuda_artigos', `${nome}.json`)
        } else if (prints && partes.length === 4 && partes[0] === 'prints') {
          const [, idioma, id, nome] = partes
          if (IDIOMA.test(idioma) && ID.test(id) && ARQUIVO_PRINT.test(nome)) {
            arquivo = path.join(prints, idioma, id, nome)
            tipo = TIPOS[nome.split('.').pop()]
          }
        }
        if (!arquivo) return next()
        if (!fs.existsSync(arquivo)) {
          res.statusCode = 404
          return res.end('{}')
        }
        res.setHeader('Content-Type', tipo)
        fs.createReadStream(arquivo).pipe(res)
      })
    },
  }
}

// Termos e Política em desenvolvimento, sem tocar no Firestore:
//   $env:LEGAL_PASTA = "D:\Projetos\gestao_obras\legal"; npm run dev
// Responde no formato da API REST do Firestore como se nada tivesse sido liberado ainda
// (o site mostra a versão mais nova da pasta). Só vale para "npm run dev".
const VERSAO = /^\d{1,4}(\.\d{1,4}){0,3}$/
function legalLocal() {
  const pasta = process.env.LEGAL_PASTA ? path.resolve(process.env.LEGAL_PASTA) : null
  const texto = (v) => ({ stringValue: v })
  return {
    name: 'legal-local',
    apply: 'serve',
    config() {
      return pasta ? { define: { 'import.meta.env.VITE_LEGAL_LOCAL': JSON.stringify('sim') } } : {}
    },
    configureServer(server) {
      if (!pasta) return
      server.config.logger.info(`  Termos e Política: lendo ${pasta}`)
      server.middlewares.use('/__legal', (req, res, next) => {
        const partes = decodeURIComponent((req.url ?? '').split('?')[0]).split('/').filter(Boolean)
        const enviar = (status, corpo) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(corpo))
        }
        if (partes[0] !== 'documentos_legais' || !['termos', 'privacidade'].includes(partes[1])) return next()
        const doc = partes[1]
        if (partes.length === 2) return enviar(404, {})
        if (partes.length === 3 && partes[2] === 'versoes') {
          const versoes = fs.existsSync(path.join(pasta, doc)) ? fs.readdirSync(path.join(pasta, doc)).filter((v) => VERSAO.test(v)) : []
          return enviar(200, { documents: versoes.map((v) => ({ name: `local/documentos_legais/${doc}/versoes/${v}` })) })
        }
        if (partes.length === 4 && partes[2] === 'versoes' && VERSAO.test(partes[3])) {
          const dir = path.join(pasta, doc, partes[3])
          if (!fs.existsSync(dir)) return enviar(404, {})
          const textos = {}
          for (const f of fs.readdirSync(dir)) {
            const idioma = f.replace(/\.md$/, '')
            if (IDIOMA.test(idioma)) textos[idioma] = texto(fs.readFileSync(path.join(dir, f), 'utf8'))
          }
          return enviar(200, { fields: { versao: texto(partes[3]), estado: texto('preparada'), textos: { mapValue: { fields: textos } } } })
        }
        return next()
      })
    },
  }
}

// Bandeiras do menu de idiomas servidas pelo próprio site em /bandeiras/<país>.svg.
// Só entram as bandeiras dos idiomas de src/i18n/registro.js (vêm do pacote flag-icons).
function bandeiras() {
  const pasta = path.resolve('node_modules/flag-icons/flags/4x3')
  const paises = [...new Set(IDIOMAS.map((i) => i.pais.toLowerCase()))]
  const ler = (pais) => fs.readFileSync(path.join(pasta, `${pais}.svg`))
  return {
    name: 'bandeiras',
    buildStart() {
      for (const pais of paises) {
        if (!fs.existsSync(path.join(pasta, `${pais}.svg`))) this.error(`Bandeira não encontrada para o país "${pais}" (registro.js)`)
      }
    },
    configureServer(server) {
      server.middlewares.use('/bandeiras', (req, res, next) => {
        const pais = (req.url ?? '').replace(/^\//, '').replace(/\.svg(\?.*)?$/, '')
        if (!paises.includes(pais)) return next()
        res.setHeader('Content-Type', 'image/svg+xml')
        res.end(ler(pais))
      })
    },
    generateBundle() {
      for (const pais of paises) this.emitFile({ type: 'asset', fileName: `bandeiras/${pais}.svg`, source: ler(pais) })
    },
  }
}

// Fontes das escritas que a Manrope não cobre (japonês, árabe, hindi...): o módulo "virtual:fontes-das-escritas" tem
// só as escritas dos idiomas de src/i18n/registro.js (campo "escrita"), cada uma num CSS baixado só no idioma dela
// (src/fontes/escritas.js). Sem idioma de outra escrita, o módulo é uma função vazia: nada a mais no site.
function fontesDasEscritas() {
  const ID = 'virtual:fontes-das-escritas'
  return {
    name: 'fontes-das-escritas',
    resolveId(id) {
      return id === ID ? `\0${ID}` : null
    },
    load(id) {
      if (id !== `\0${ID}`) return null
      try {
        return moduloDasFontes(IDIOMAS)
      } catch (erro) {
        this.error(erro.message)
      }
    },
  }
}

// https://vite.dev/config/
// Prévia para ver de fora (VITE_PREVIA=sim npx vite build --outDir <pasta>): endereços relativos.
// O site de verdade continua com base "/".
export default defineConfig({
  base: process.env.VITE_PREVIA === 'sim' ? './' : '/',
  plugins: [react(), ajudaLocal(), legalLocal(), bandeiras(), fontesDasEscritas()],
})
