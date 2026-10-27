// Testes dos idiomas do site: cadeia de textos, escolha pelo navegador e endereços.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    IDIOMAS, analisarCaminho, cadeia, caminhoAjuda, caminhoArtigo, caminhoAssunto, caminhoInicio, caminhoLegal,
    escolherIdioma, idDaSecao, palavraDeEnderecoValida, secaoDaAncora, slugDoTexto,
} from './idiomas.js';
import { acharModulo, criarRotas, slugDoModulo } from '../ajuda/enderecos.js';

test('cadastro: variante herda as palavras dos endereços da base', () => {
    const enGB = IDIOMAS.find((i) => i.codigo === 'en-GB');
    assert.equal(enGB.rotas.ajuda, 'help');
    assert.equal(enGB.rotas.secoes.precos, 'pricing');
    assert.equal(enGB.prefixo, 'en-gb');
});

test('cadeia: variante → base → inglês → português', () => {
    assert.deepEqual(cadeia('es-MX'), ['es-MX', 'es-ES', 'en-US', 'pt-BR']);
    assert.deepEqual(cadeia('pt-PT'), ['pt-PT', 'pt-BR', 'en-US']);
    assert.deepEqual(cadeia('pt-BR'), ['pt-BR', 'en-US']);
    assert.deepEqual(cadeia('en-US'), ['en-US', 'pt-BR']);
});

test('navegador: escolhe pelo idioma, pela região e pela ordem de preferência', () => {
    assert.equal(escolherIdioma(['pt-BR']), 'pt-BR');
    assert.equal(escolherIdioma(['pt']), 'pt-BR');
    assert.equal(escolherIdioma(['pt-AO']), 'pt-PT');
    assert.equal(escolherIdioma(['es-AR', 'en']), 'es-MX');
    assert.equal(escolherIdioma(['es']), 'es-ES');
    assert.equal(escolherIdioma(['en-NZ']), 'en-AU');
    assert.equal(escolherIdioma(['en-IE']), 'en-GB');
    assert.equal(escolherIdioma(['de-DE', 'en-GB']), 'en-GB');
    assert.equal(escolherIdioma(['de-DE']), 'en-US');
    assert.equal(escolherIdioma([]), 'en-US');
    assert.equal(escolherIdioma(['xx-!!', 'es-CO']), 'es-MX');
    // Valor antigo guardado pelo detector anterior.
    assert.equal(escolherIdioma(['es-MX', 'pt-BR']), 'es-MX');
});

test('endereços em cada idioma', () => {
    assert.equal(caminhoInicio('pt-BR'), '/pt-br/');
    assert.equal(caminhoInicio('en-GB', 'precos'), '/en-gb/#pricing');
    assert.equal(caminhoAjuda('es-MX'), '/es-mx/ayuda');
    assert.equal(caminhoAssunto('en-US', 'project-finances'), '/en-us/help/topic/project-finances');
    assert.equal(caminhoArtigo('pt-PT', 'criar-rdo'), '/pt-pt/ajuda/criar-rdo');
});

test('leitura do endereço', () => {
    assert.deepEqual(analisarCaminho('/'), { tipo: 'raiz' });
    assert.deepEqual(analisarCaminho('/xx-yy/'), { tipo: 'desconhecido' });
    assert.deepEqual(analisarCaminho('/pt-br/'), { tipo: 'pagina', codigo: 'pt-BR', pagina: 'inicio', canonico: null });
    assert.deepEqual(analisarCaminho('/en-us/help'), { tipo: 'pagina', codigo: 'en-US', pagina: 'ajuda', canonico: null });
    assert.deepEqual(
        analisarCaminho('/es-es/ayuda/tema/finanzas-de-la-obra'),
        { tipo: 'pagina', codigo: 'es-ES', pagina: 'assunto', modulo: 'finanzas-de-la-obra', canonico: null },
    );
    assert.deepEqual(
        analisarCaminho('/en-gb/help/create-daily-report'),
        { tipo: 'pagina', codigo: 'en-GB', pagina: 'artigo', slug: 'create-daily-report', canonico: null },
    );
    assert.equal(analisarCaminho('/pt-br/qualquer').pagina, 'nao-encontrado');
    assert.equal(analisarCaminho('/pt-br/ajuda/a/b/c').pagina, 'nao-encontrado');
});

test('grafia diferente vai para o endereço certo', () => {
    assert.equal(analisarCaminho('/PT-BR').canonico, '/pt-br/');
    assert.equal(analisarCaminho('/en-us/ajuda').canonico, '/en-us/help');
    assert.equal(analisarCaminho('/en-us/ajuda/assunto/obras').canonico, '/en-us/help/topic/obras');
    assert.equal(analisarCaminho('/es-ES/ayuda/crear-reporte').canonico, '/es-es/ayuda/crear-reporte');
});

test('endereços antigos da Central (/ajuda/pt-BR/...)', () => {
    assert.deepEqual(analisarCaminho('/ajuda'), { tipo: 'antigo', codigo: null, pagina: 'ajuda' });
    assert.deepEqual(analisarCaminho('/ajuda/en-GB'), { tipo: 'antigo', codigo: 'en-GB', pagina: 'ajuda' });
    assert.deepEqual(analisarCaminho('/ajuda/pt-BR/assunto/rdo'), { tipo: 'antigo', codigo: 'pt-BR', pagina: 'assunto', modulo: 'rdo' });
    assert.deepEqual(analisarCaminho('/ajuda/es-MX/crear-reporte'), { tipo: 'antigo', codigo: 'es-MX', pagina: 'artigo', slug: 'crear-reporte' });
    assert.deepEqual(analisarCaminho('/ajuda/criar-rdo'), { tipo: 'antigo', codigo: null, pagina: 'artigo', slug: 'criar-rdo' });
});

test('âncoras da página inicial em qualquer idioma', () => {
    assert.equal(secaoDaAncora('#precos'), 'precos');
    assert.equal(secaoDaAncora('#pricing'), 'precos');
    assert.equal(secaoDaAncora('#preguntas-frecuentes'), 'faq');
    assert.equal(secaoDaAncora('#nada'), null);
    assert.equal(secaoDaAncora(''), null);
    assert.equal(idDaSecao('es-MX', 'precos'), 'precios');
});

test('nome do assunto no endereço', () => {
    assert.equal(slugDoTexto('Diário de obra (RDO)'), 'diario-de-obra-rdo');
    assert.equal(slugDoTexto('Suministros y almacén'), 'suministros-y-almacen');
    assert.equal(slugDoTexto('Помощь и Тема'), 'помощь-и-тема');
    const financeiro = { id: 'financeiro', nome: 'Project finances', nomes: { 'pt-BR': 'Financeiro da obra', 'en-US': 'Project finances' } };
    assert.equal(slugDoModulo(financeiro, 'en-US'), 'project-finances');
    assert.equal(slugDoModulo(financeiro, 'pt-BR'), 'financeiro-da-obra');
    assert.equal(slugDoModulo({ id: 'obras', nome: 'Projects' }, 'en-US'), 'projects');
    const modulos = [financeiro, { id: 'obras', nome: 'Projects', nomes: { 'pt-BR': 'Obras', 'en-US': 'Projects' } }];
    assert.equal(acharModulo(modulos, 'project-finances', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'financeiro', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'financeiro-da-obra', 'en-US'), financeiro);
    assert.equal(acharModulo(modulos, 'nada', 'en-US'), null);
    assert.equal(criarRotas('en-GB').assunto(financeiro), '/en-gb/help/topic/project-finances');
});

test('Termos de Uso e Política de Privacidade com a palavra de cada idioma', () => {
    assert.equal(caminhoLegal('pt-BR', 'termos'), '/pt-br/termos-de-uso');
    assert.equal(caminhoLegal('pt-PT', 'termos'), '/pt-pt/termos-de-utilizacao');
    assert.equal(caminhoLegal('pt-PT', 'privacidade'), '/pt-pt/politica-de-privacidade');
    assert.equal(caminhoLegal('en-GB', 'privacidade'), '/en-gb/privacy-policy');
    assert.equal(caminhoLegal('es-MX', 'termos'), '/es-mx/terminos-de-uso');
    assert.deepEqual(
        analisarCaminho('/en-us/terms-of-use'),
        { tipo: 'pagina', codigo: 'en-US', pagina: 'legal', documento: 'termos', canonico: null },
    );
    // Palavra de outro idioma vai para a palavra certa.
    assert.equal(analisarCaminho('/en-us/termos-de-uso').canonico, '/en-us/terms-of-use');
    assert.equal(analisarCaminho('/pt-pt/termos-de-uso').canonico, '/pt-pt/termos-de-utilizacao');
    assert.equal(analisarCaminho('/ES-ES/privacy-policy').canonico, '/es-es/politica-de-privacidad');
    assert.equal(analisarCaminho('/pt-br/termos-de-uso/x').pagina, 'nao-encontrado');
});

test('endereços antigos do WordPress (lojas de aplicativos) continuam valendo', () => {
    assert.deepEqual(analisarCaminho('/termos-de-uso/'), { tipo: 'antigo', codigo: null, pagina: 'legal', documento: 'termos' });
    assert.deepEqual(analisarCaminho('/politicas-de-privacidade'), { tipo: 'antigo', codigo: null, pagina: 'legal', documento: 'privacidade' });
    assert.equal(analisarCaminho('/termos-de-uso/outra').tipo, 'desconhecido');
});

// Endereço na escrita do idioma (decisão do Francis, 26/10/2026): artigos de exemplo só de teste, em japonês e
// em árabe, num idioma do site de hoje (o caminho é o mesmo quando o idioma deles entrar).
const JAPONES = '写真を追加';
const ARABE = 'إضافة-صورة';

test('palavra de endereço em qualquer escrita: letras, marcas, números e hífen entre as palavras, em NFC', () => {
    for (const p of ['criar-rdo', JAPONES, ARABE, 'पासवर्ड-बदलें', 'เพิ่มรูปภาพ', '사진-추가', 'добавить-фото', 'προσθήκη-φωτογραφίας', 'הוספת-תמונה', 'ヘルプ', 'مساعدة', 'सहायता', 'ช่วยเหลือ', '도움말', 'βοήθεια', 'помощь', 'עזרה', '帮助', 'ajuda']) {
        assert.ok(palavraDeEnderecoValida(p), p);
    }
    for (const p of ['Ajuda', 'Помощь', 'a b', 'a/b', 'a--b', '-a', 'a-', '', 'ヘルプ。', 'a?b', 'a%2Fb', '\u093Fx', 'cafe\u0301', 'Ⅻ', null]) {
        assert.ok(!palavraDeEnderecoValida(p), JSON.stringify(p));
    }
});

test('nome do assunto em outras escritas: marcas da palavra ficam, acento do latim/grego/cirílico e vogais opcionais saem', () => {
    // Antes as marcas saíam todas: o hindi e o tailandês perdiam as vogais e o japonês o dakuten (ダ → タ).
    assert.equal(slugDoTexto('दैनिक रिपोर्ट'), 'दैनिक-रिपोर्ट');
    assert.equal(slugDoTexto('รายงานประจำวัน'), 'รายงานประจำวัน');
    assert.equal(slugDoTexto('ダウンロード'), 'ダウンロード');
    assert.equal(slugDoTexto('일일 보고서'), '일일-보고서');
    assert.equal(slugDoTexto('Ρυθμίσεις λογαριασμού'), 'ρυθμισεις-λογαριασμου');
    assert.equal(slugDoTexto('التَّقْرِيرُ اليَوْمِيّ'), 'التقرير-اليومي');
    assert.equal(slugDoTexto('דּוֹחַ יוֹמִי'), 'דוח-יומי');
    assert.equal(slugDoTexto('\u095Eोटो'), 'फ\u093Cोटो', 'hindi com nukta já composto: NFC');
    assert.equal(slugDoTexto('財務 / 工程'), '財務-工程');
    assert.equal(slugDoTexto('a \u093F b'), 'a-b', 'marca solta sem letra não fica');
    for (const nome of ['दैनिक रिपोर्ट', 'ダウンロード', 'التَّقْرِيرُ اليَوْمِيّ', 'Diário de obra (RDO)', 'ΡΥΘΜΙΣΕΙΣ']) {
        assert.ok(palavraDeEnderecoValida(slugDoTexto(nome)), nome);
    }
});

test('artigo com endereço em japonês e em árabe: caminho, leitura com %XX e em NFD', () => {
    assert.equal(caminhoArtigo('pt-BR', JAPONES), `/pt-br/ajuda/${JAPONES}`);
    assert.equal(caminhoArtigo('en-US', ARABE), `/en-us/help/${ARABE}`);
    const lido = { tipo: 'pagina', codigo: 'pt-BR', pagina: 'artigo', slug: JAPONES, canonico: null };
    // O navegador manda o endereço com %XX; o build (páginas prontas) e o React Router podem passar decodificado.
    assert.deepEqual(analisarCaminho(`/pt-br/ajuda/${encodeURIComponent(JAPONES)}`), lido);
    assert.deepEqual(analisarCaminho(`/pt-br/ajuda/${JAPONES}`), lido);
    assert.deepEqual(analisarCaminho(new URL(`/en-us/help/${ARABE}`, 'https://x.com').pathname), { ...lido, codigo: 'en-US', slug: ARABE });
    // Palavra da Central de outro idioma: vai para o endereço certo, com o slug intacto.
    assert.equal(analisarCaminho(`/en-us/ajuda/${encodeURIComponent(ARABE)}`).canonico, `/en-us/help/${ARABE}`);
    // Decomposto (NFD: ジ como シ + ゙): lido em NFC e levado ao endereço em NFC.
    const nfd = 'ジ'.normalize('NFD');
    const comNfd = analisarCaminho(`/pt-br/ajuda/${encodeURIComponent(`${nfd}ム`)}`);
    assert.equal(comNfd.slug, 'ジム');
    assert.equal(comNfd.canonico, '/pt-br/ajuda/ジム');
    // % solto não quebra a leitura.
    assert.equal(analisarCaminho('/pt-br/ajuda/100%').slug, '100%');
    // Rotas do componente: os links internos levam o slug como está (o navegador põe os %XX).
    assert.equal(criarRotas('pt-BR').artigo(JAPONES), `/pt-br/ajuda/${JAPONES}`);
});

test('assunto com nome em outra escrita: endereço e busca pelo pedaço do endereço', () => {
    const modulo = { id: 'diario', nome: 'Daily report', nomes: { 'pt-BR': 'デイリーレポート', 'en-US': 'التقرير اليومي' } };
    assert.equal(slugDoModulo(modulo, 'pt-BR'), 'デイリーレポート');
    assert.equal(slugDoModulo(modulo, 'en-US'), 'التقرير-اليومي');
    assert.equal(criarRotas('en-US').assunto(modulo), '/en-us/help/topic/التقرير-اليومي');
    const lido = analisarCaminho(`/en-us/help/topic/${encodeURIComponent('التقرير-اليومي')}`);
    assert.equal(lido.modulo, 'التقرير-اليومي');
    assert.equal(acharModulo([modulo], lido.modulo, 'en-US'), modulo);
    assert.equal(acharModulo([modulo], 'التَّقْرِير-اليَوْمِيّ', 'en-US'), modulo, 'com harakat também');
});
