# Central de Ajuda do site

O conteúdo não fica neste projeto: ele é escrito em `gestao_obras/ajuda/` e publicado no
Firestore pelo publicador (`gestao_obras/ferramentas/ajuda`). O site só lê.

## Endereços

| Endereço | Página |
| --- | --- |
| `/pt-br/ajuda` · `/en-us/help` · `/es-es/ayuda` | Início: busca, guias completos, assuntos e essenciais |
| `/pt-br/ajuda/assunto/diario-de-obra-rdo` · `/en-us/help/topic/daily-reports` | Todos os artigos de um assunto (nome do módulo no idioma) |
| `/pt-br/ajuda/criar-rdo` · `/en-gb/help/create-daily-report` | Artigo (o final é o `slug` do artigo naquele idioma) |
| `/ajuda`, `/ajuda/pt-BR/...` | Endereços antigos: levam ao endereço novo no idioma certo |

As palavras `ajuda`/`help`/`ayuda` e `assunto`/`topic`/`tema` vêm de `src/i18n/registro.js`
(ver `src/i18n/LEIAME.md`). O nome do assunto no endereço é o nome do módulo sem acento; para isso o
índice publicado traz `modulos[].nomes` (nome em todos os idiomas). Trocar o idioma no menu leva para a
mesma página no idioma novo. Endereço com o `id` do artigo ou do módulo, ou com o nome em outro idioma
(ex.: `/en-us/help/criar-rdo`), é corrigido sozinho para o endereço certo.

Idiomas dos artigos: `pt-BR`, `pt-PT`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `es-ES`, `es-MX`
(`src/ajuda/idiomas.js`). Um idioma do site sem artigos próprios mostra os artigos do primeiro idioma
da cadeia dele que tiver (ex.: francês → inglês), com a tela no idioma do site.

Como o site é de página única, a hospedagem precisa devolver o `index.html` para qualquer
endereço que não seja um arquivo (regra no `.htaccess` da Hostinger). Sem ela, abrir um link de
artigo direto dá erro 404.

## De onde vem o conteúdo

- **Produção:** `ajuda_indices/{idioma}` e `ajuda_artigos/{id}` pela API REST do Firestore
  (leitura pública pelas regras; o site não usa chave nem SDK). Prints pelo endereço público do
  Storage (`ajuda/prints/...`).
- **Cache:** o índice e os artigos ficam guardados no navegador. O índice aparece na hora e é
  conferido em segundo plano; o artigo só é baixado de novo quando o hash dele muda.
- **Desenvolvimento:** sem tocar no Firestore, a partir da saída do publicador:

```powershell
# no gestao_obras\ferramentas\ajuda
node bin/publicar.mjs --saida D:\Projetos\ajuda_saida
# aqui
$env:AJUDA_SAIDA = "D:\Projetos\ajuda_saida"
$env:AJUDA_PRINTS = "D:\Projetos\ajuda_prints"   # opcional: <idioma>\<id>\<arquivo>
npm run dev
```

## Arquivos

| Arquivo | Faz |
| --- | --- |
| `src/ajuda/dados.js` | Lê índice e artigo (Firestore ou local), cache e endereço dos prints |
| `src/ajuda/busca.js` | Busca sem acento e sem maiúscula; título > tag > resumo > texto dos passos |
| `src/ajuda/texto.js` | Lê o texto dos passos: só `**negrito**`, lista `- ` e `[texto](artigo:id)`; nunca HTML |
| `src/ajuda/idiomas.js` | Idiomas em que os artigos são publicados e qual usar para cada idioma do site |
| `src/ajuda/enderecos.js` | Endereços da Central no idioma do site (assunto pelo nome do módulo) |
| `src/components/ajuda/` | Páginas (início, assunto, artigo), busca e estados (carregando, erro, vazio) |

Testes da busca, do texto e dos idiomas: `npm test`.
