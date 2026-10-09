# Central de Ajuda do site

O conteúdo não fica neste projeto: ele é escrito em `gestao_obras/ajuda/` e publicado no
Firestore pelo publicador (`gestao_obras/ferramentas/ajuda`). O site só lê.

## Endereços

| Endereço | Página |
| --- | --- |
| `/ajuda` | Leva para a Central no idioma atual do site |
| `/ajuda/pt-BR` | Início: busca, guias completos, assuntos e essenciais |
| `/ajuda/pt-BR/assunto/diario-de-obra` | Todos os artigos de um assunto |
| `/ajuda/pt-BR/criar-rdo` | Artigo (o final é o `slug` do artigo naquele idioma) |

Idiomas: `pt-BR`, `pt-PT`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `es-ES`, `es-MX`. Trocar o idioma no
menu do site leva para a mesma página no idioma novo. Um endereço com o `id` do artigo no lugar
do `slug` (ex.: `/ajuda/en-US/criar-rdo`) é corrigido sozinho para o endereço certo.

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
| `src/ajuda/idiomas.js` | Idiomas da Central e a ligação com os idiomas do site |
| `src/components/ajuda/` | Páginas (início, assunto, artigo), busca e estados (carregando, erro, vazio) |

Testes da busca, do texto e dos idiomas: `npm test`.
