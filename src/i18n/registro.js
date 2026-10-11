// =====================================================================================
//  IDIOMAS DO SITE: é o único lugar para cadastrar um idioma.
// =====================================================================================
//
// Como funciona (o mesmo modelo do app):
//   - Idioma "base" (sem campo base): tem o arquivo de textos completo em textos/<codigo>.json.
//   - Variante regional (com campo base): o arquivo textos/<codigo>.json tem SÓ o que muda em
//     relação à base (ex.: en-GB só tem "Centre", "colour"...). O resto vem da base sozinho.
//   - Texto que faltar em qualquer idioma aparece no idioma "internacional" (inglês) e, por
//     último, no de referência (português do Brasil, onde os textos nascem).
//
// Para incluir um idioma novo (ex.: francês):
//   1. Acrescente uma entrada abaixo (código, nome, país da bandeira, moeda, palavras dos endereços).
//   2. Rode:  npm run idiomas -- novo fr-FR
//      (cria textos/fr-FR.json vazio e o arquivo a-traduzir/fr-FR.json com todos os textos em inglês)
//   3. Traduza os valores de a-traduzir/fr-FR.json e rode:  npm run idiomas -- importar fr-FR
//   4. Rode:  npm run idiomas   (confere tudo e refaz textos/PENDENCIAS.md)
// Nada mais precisa mudar: menu de idiomas, rodapé, endereços, preços e hreflang leem daqui.
//
// Campos:
//   codigo   BCP 47 com região (pt-BR, en-GB...). Vira o começo do endereço em minúsculas (/pt-br/).
//            Use só idioma de 2 letras + região de 2 letras: é o formato que o .htaccess entrega ao site.
//   nome     nome do idioma escrito no próprio idioma (é o que aparece no menu).
//   curto    rótulo curto do menu do celular.
//   pais     código do país da bandeira (ISO 3166, 2 letras).
//   moeda    moeda dos preços (tem de existir em pricing.js).
//   direcao  'ltr' (padrão) ou 'rtl' (árabe, hebraico).
//   base     só nas variantes regionais: o idioma base de onde vêm os textos que não mudam.
//   regioes  outras regiões que devem cair neste idioma quando o navegador pedir
//            (ex.: navegador em es-AR abre o espanhol do México, não o da Espanha).
//   rotas    palavras dos endereços. Na variante regional, só se forem diferentes da base.
//            Letras minúsculas, números e hífen; podem ter acento ou outro alfabeto (ex.: ヘルプ).
//            ajuda   → /pt-br/ajuda
//            assunto → /pt-br/ajuda/assunto/<assunto>
//            secoes  → âncoras da página inicial (/pt-br/#precos)

export const REFERENCIA = 'pt-BR';
export const INTERNACIONAL = 'en-US';

export const IDIOMAS = [
    {
        codigo: 'pt-BR', nome: 'Português (Brasil)', curto: 'PT-BR', pais: 'BR', moeda: 'brl',
        rotas: {
            ajuda: 'ajuda', assunto: 'assunto',
            secoes: { sobre: 'sobre', recursos: 'recursos', equipe: 'equipe', precos: 'precos', faq: 'perguntas-frequentes' },
        },
    },
    {
        codigo: 'pt-PT', base: 'pt-BR', nome: 'Português (Portugal)', curto: 'PT-PT', pais: 'PT', moeda: 'eur',
        regioes: ['AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'MO'],
    },
    {
        codigo: 'en-US', nome: 'English (US)', curto: 'EN-US', pais: 'US', moeda: 'usd',
        rotas: {
            ajuda: 'help', assunto: 'topic',
            secoes: { sobre: 'about', recursos: 'features', equipe: 'team', precos: 'pricing', faq: 'faq' },
        },
    },
    {
        codigo: 'en-GB', base: 'en-US', nome: 'English (UK)', curto: 'EN-GB', pais: 'GB', moeda: 'gbp',
        regioes: ['IE', 'IN', 'ZA', 'SG', 'HK', 'NG', 'KE'],
    },
    { codigo: 'en-AU', base: 'en-US', nome: 'English (Australia)', curto: 'EN-AU', pais: 'AU', moeda: 'aud', regioes: ['NZ'] },
    { codigo: 'en-CA', base: 'en-US', nome: 'English (Canada)', curto: 'EN-CA', pais: 'CA', moeda: 'cad' },
    {
        codigo: 'es-ES', nome: 'Español (España)', curto: 'ES-ES', pais: 'ES', moeda: 'eur',
        rotas: {
            ajuda: 'ayuda', assunto: 'tema',
            secoes: { sobre: 'acerca-de', recursos: 'funciones', equipe: 'equipo', precos: 'precios', faq: 'preguntas-frecuentes' },
        },
    },
    {
        codigo: 'es-MX', base: 'es-ES', nome: 'Español (México/LATAM)', curto: 'ES-MX', pais: 'MX', moeda: 'mxn',
        regioes: ['419', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'GT', 'HN', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'US', 'UY', 'VE'],
    },
];
