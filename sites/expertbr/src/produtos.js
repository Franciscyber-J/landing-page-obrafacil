// APLICATIVOS DA EXPERTBR: um item por aplicativo. Novo aplicativo = um item a mais aqui (e os textos dele em
// src/textos), nada mais: o cartão, o menu, os dados estruturados, o llms.txt e o sitemap leem desta lista.
//
// Cada app fica num subdomínio do expertbr.com que não muda (decisão do Francis, 20/11/2026): ObraFácil em
// appobrafacil.expertbr.com, Orbit em orbit.expertbr.com, os próximos no mesmo padrão.
//
// Campos:
//   id         nome interno (letras minúsculas e hífen).
//   nome       nome do app (marca: igual em todos os idiomas).
//   estado     'no-ar' (cartão com link para o site e as lojas) ou 'em-breve' (cartão sem link nenhum, sem preço e
//              sem data). Ao lançar, troque para 'no-ar' e confira os textos.
//   endereco   site do app (guardado mesmo "em breve", para ligar depois).
//   pagina     endereço do site do app no idioma da página (só 'no-ar'); sem a função, o endereco.
//   cor        identidade do cartão no CSS (src/estilos.css, [data-produto]).
//   simbolo    símbolo do app (public/marcas), com largura e altura.
//   textos     chaves de texto. "obrafacil:..." vem dos textos do site do ObraFácil (src/i18n/textos, os mesmos
//              do site dele, nos 29 idiomas); sem o prefixo, dos textos da ExpertBR (src/textos).
//              linha (frase curta), descricao, destaques (lista de chaves ou uma chave de lista), plataformas,
//              nota (opcional), aviso (só 'em-breve').
//   telas      telas reais do app (prints da Central de Ajuda, public/telas/<idioma>/<nome>.webp do site do
//              ObraFácil), com o texto alternativo; legenda: o aviso "dados de exemplo".
//   lojas      onde baixar ou usar (só 'no-ar'): rotulo (nome da loja ou chave de texto) e url(codigo).
//   seo        dados do aplicativo para o Google (schema.org SoftwareApplication): sistemas, categoria e as chaves
//              da descrição e da subcategoria. Só para 'no-ar': app que ainda não existe não entra nos dados.

import { caminhoInicio } from '../../../src/i18n/idiomas.js';
import { IDIOMAS_COM_TELAS } from '../../../src/telas.js';
import { WINDOWS, appStore, cadastro, googlePlay } from '../../../src/links.js';

export const PRODUTOS = [
    {
        id: 'obrafacil',
        nome: 'ObraFácil',
        estado: 'no-ar',
        endereco: 'https://appobrafacil.expertbr.com',
        pagina: (codigo) => `https://appobrafacil.expertbr.com${caminhoInicio(codigo)}`,
        cor: 'obrafacil',
        simbolo: { arquivo: 'marcas/obrafacil.webp', largura: 128, altura: 128 },
        textos: {
            linha: 'obrafacil:footer.tagline',
            descricao: 'obrafacil:hero.subtitulo',
            destaques: [
                'obrafacil:recursos.itens.cronograma.titulo',
                'obrafacil:recursos.itens.diario.titulo',
                'obrafacil:recursos.itens.checklists.titulo',
                'obrafacil:recursos.itens.financeiro.titulo',
                'obrafacil:recursos.itens.equipe.titulo',
                'obrafacil:recursos.itens.compras.titulo',
            ],
            plataformas: 'obrafacil:hero.plataformas',
            nota: 'obrafacil:hero.semCartao',
        },
        telas: {
            itens: [
                { nome: 'rdo', alt: 'obrafacil:hero.telas.diario' },
                { nome: 'etapas', alt: 'obrafacil:hero.telas.cronograma' },
            ],
            legenda: 'obrafacil:hero.legendaTela',
        },
        lojas: [
            { rotulo: 'Google Play', url: (codigo) => googlePlay(codigo) },
            { rotulo: 'App Store', url: () => appStore() },
            { rotulo: 'Windows', url: () => WINDOWS },
            { rotulo: 'produtos.navegador', url: (codigo) => cadastro(codigo) },
        ],
        seo: {
            sistemas: 'Android, iOS, Windows, Web',
            categoria: 'BusinessApplication',
            subcategoria: 'obrafacil:seo.app.categoria',
            descricao: 'obrafacil:seo.app.descricao',
        },
    },
    {
        id: 'orbit',
        nome: 'Orbit',
        estado: 'em-breve',
        endereco: 'https://orbit.expertbr.com',
        cor: 'orbit',
        // Ícone do Orbit (o mesmo do app: balão de conversa no coral, orbit/public/app-icon.html).
        simbolo: { arquivo: 'marcas/orbit.svg', largura: 64, altura: 64 },
        textos: {
            linha: 'produtos.orbit.linha',
            descricao: 'produtos.orbit.descricao',
            destaques: 'produtos.orbit.destaques',
            aviso: 'produtos.orbit.aviso',
        },
    },
];

export const ESTADOS = ['no-ar', 'em-breve'];

// Os apps que já estão no ar (o primeiro é o da ação principal da abertura).
export const NO_AR = PRODUTOS.filter((p) => p.estado === 'no-ar');

// Endereço do site do app no idioma da página (null se o app ainda não está no ar: o cartão não leva a lugar nenhum).
export function paginaDoProduto(produto, codigo) {
    if (produto.estado !== 'no-ar') return null;
    return produto.pagina ? produto.pagina(codigo) : produto.endereco;
}

// Telas: o print do próprio idioma; sem ele, o do primeiro idioma da cadeia que tem (como no site do ObraFácil,
// src/telas.js). Endereço dentro do site da ExpertBR (o build copia os arquivos para dist/telas).
export function enderecoDaTela(idiomaDasTelas, nome) {
    return `/telas/${idiomaDasTelas}/${nome}.webp`;
}

// Arquivos de public/ do site do ObraFácil que o build copia (telas de todos os apps, nos idiomas que têm print).
export function arquivosDasTelas() {
    const lista = [];
    for (const p of PRODUTOS) {
        for (const t of p.telas?.itens ?? []) for (const idioma of IDIOMAS_COM_TELAS) lista.push(`telas/${idioma}/${t.nome}.webp`);
    }
    return lista;
}
