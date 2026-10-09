import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ajudaLocal()],
})
