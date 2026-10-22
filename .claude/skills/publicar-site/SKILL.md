---
name: publicar-site
description: Gerar o site do ObraFácil e publicar na Hostinger (dist, .htaccess, plugin de segurança do WordPress) e conferir no ar. Use ao preparar ou revisar qualquer publicação do site.
---

# Publicar o site

Quem publica é o Francis. A Hostinger não gera o site a partir do GitHub: ele envia os arquivos pelo
Gerenciador de Arquivos, em `public_html/appobrafacil`, onde o site convive com um WordPress.

## Antes

1. Tudo na `main` (merge feito por ele).
2. `npm ci`, `npm test`, `npm run lint` e `npm run build` sem erro (o build roda `npm run idiomas` antes).
3. Se a Central de Ajuda mudou de formato, os artigos correspondentes já publicados no Firestore (gestao_obras).

## Enviar

```powershell
cd D:\Projetos\landing_page
git switch main
git pull
npm ci
npm run build
```

1. Enviar **o conteúdo** de `dist` (não a pasta): `index.html`, `assets/`, `bandeiras/`, `email/` (o logo dos
   e-mails do app, `email/logo-obrafacil.png`: os e-mails já enviados apontam para este endereço, então ele nunca
   muda de nome nem sai do ar). Substituir; nunca apagar arquivos do WordPress.
2. Só se `hospedagem/.htaccess` mudou: baixar antes o `.htaccess` atual para o computador (é a volta) e enviar o novo.
3. Só se o plugin mudou: `hospedagem/wordpress/mu-plugins/obrafacil-seguranca.php` em `wp-content/mu-plugins/`.
4. Painel da Hostinger → LiteSpeed Cache → Limpar todo o cache.

## Conferir no ar

```powershell
node hospedagem/verificar.mjs
```

Tudo OK. O logo dos e-mails abre como imagem: `https://appobrafacil.expertbr.com/email/logo-obrafacil.png`
(352 × 78, PNG). Depois, no navegador: `/` leva ao idioma certo, troca de idioma mantém a página, a Central abre um artigo,
e o console não mostra erro (avisos de `Content-Security-Policy-Report-Only` são anotados para a decisão de ativar a CSP).

## Voltar atrás

Enviar o `.htaccess` guardado, apagar o plugin se ele foi a causa, e reenviar o `dist` do commit anterior
(`git switch --detach <commit>`, `npm ci`, `npm run build`).
