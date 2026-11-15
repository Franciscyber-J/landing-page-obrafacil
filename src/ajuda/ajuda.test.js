// Testes da busca, do leitor de texto e dos idiomas da Central de Ajuda.
// Rodar: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buscar, normalizar, prepararBusca, termosDaConsulta } from './busca.js';
import { lerLinha, lerTexto } from './texto.js';
import { idiomaDoConteudo, IDIOMAS_AJUDA } from './idiomas.js';
import { CODIGOS } from '../i18n/idiomas.js';

const ARTIGOS = [
    { id: 'cadastrar-colaborador', titulo: 'Como cadastrar um colaborador na sua equipe', resumo: 'Cadastre quem trabalha na obra.', tags: ['funcionário', 'pedreiro'], busca: 'Abra Equipe e toque em Novo colaborador.', prioritario: true },
    { id: 'criar-rdo', titulo: 'Como criar um Diário de Obra (RDO)', resumo: 'Registre o dia da obra.', tags: ['rdo', 'relatório diário', 'fotos'], busca: 'Em EQUIPE DA OBRA marque a presença de cada colaborador.', prioritario: true },
    { id: 'pdf-do-rdo', titulo: 'Como baixar e compartilhar o PDF do RDO', resumo: 'Envie o relatório pelo WhatsApp.', tags: ['pdf'], busca: 'Toque em Compartilhar.', prioritario: false },
];
const preparado = prepararBusca(ARTIGOS, 'pt-BR');
const ids = (lista) => lista.map((a) => a.id);

test('normaliza acento, maiúscula e pontuação', () => {
    assert.equal(normalizar('Relatório DIÁRIO (RDO)!'), 'relatorio diario rdo');
    assert.equal(normalizar('Ação e Pão'), 'acao e pao');
});

test('busca sem acento acha texto com acento', () => {
    // As duas palavras estão no RDO; só "relatório" no PDF (tolerante: vem depois).
    assert.deepEqual(ids(buscar(preparado, 'relatorio diario')), ['criar-rdo', 'pdf-do-rdo']);
    assert.deepEqual(ids(buscar(preparado, 'funcionario')), ['cadastrar-colaborador']);
});

test('título pesa mais que o texto dos passos', () => {
    // "colaborador" está no título de um e só no texto do outro.
    assert.deepEqual(ids(buscar(preparado, 'colaborador')), ['cadastrar-colaborador', 'criar-rdo']);
});

test('tolerante: não exige todas as palavras e ordena por relevância; palavras vazias do idioma são ignoradas', () => {
    assert.deepEqual(ids(buscar(preparado, 'como baixar o pdf')), ['pdf-do-rdo']);
    // Nenhum artigo tem as duas: aparecem os que têm uma, no título antes do texto dos passos.
    assert.deepEqual(ids(buscar(preparado, 'pdf colaborador')), ['pdf-do-rdo', 'cadastrar-colaborador', 'criar-rdo']);
    // "pdf" e "rdo" no título do PDF passam na frente de "rdo" no título e "colaborador" no texto dos passos.
    assert.deepEqual(ids(buscar(preparado, 'pdf do colaborador no rdo')), ['pdf-do-rdo', 'criar-rdo', 'cadastrar-colaborador']);
    assert.deepEqual(ids(buscar(preparado, 'pdf palavraquenaoexiste')), ['pdf-do-rdo']);
    assert.deepEqual(buscar(preparado, 'xyzqwk qwkxyz'), [], 'vazio só quando nada bate');
    assert.deepEqual(termosDaConsulta('como fazer o RDO', 'pt-BR'), ['fazer', 'rdo']);
    assert.deepEqual(termosDaConsulta('como', 'pt-BR'), ['como']);
    assert.deepEqual(termosDaConsulta('Fotos des Bautagesberichts fehlen im PDF', 'de-DE'), ['fotos', 'bautagesberichts', 'fehlen', 'pdf']);
});

test('plural acha singular e pedaço de palavra também acha', () => {
    assert.deepEqual(ids(buscar(preparado, 'pdfs')), ['pdf-do-rdo']);
    assert.ok(ids(buscar(preparado, 'colab')).includes('cadastrar-colaborador'));
});

test('busca vazia não devolve nada e o limite é respeitado', () => {
    assert.deepEqual(buscar(preparado, '   '), []);
    assert.equal(buscar(preparado, 'rdo', { limite: 1 }).length, 1);
});

// Frases de ajuda nas escritas dos idiomas que vão entrar: [idioma, texto, normalizado, termos da consulta].
// As mesmas do campo "escritas" de ajuda/testes/busca_casos.json no gestao_obras (a busca do app tem
// de dar o mesmo resultado).
const ESCRITAS = [
    ['ru', 'Как добавить фото в ежедневный отчёт?', 'как добавить фото в ежедневныи отчет', ['добавить', 'фото', 'ежедневныи', 'отчет']],
    ['ru', 'ОТЧЁТ в PDF', 'отчет в pdf', ['отчет', 'pdf']],
    ['el', 'Πώς προσθέτω φωτογραφίες στην ημερήσια αναφορά;', 'πωσ προσθετω φωτογραφιεσ στην ημερησια αναφορα', ['προσθετω', 'φωτογραφιεσ', 'ημερησια', 'αναφορα']],
    ['el', 'ΡΥΘΜΙΣΕΙΣ λογαριασμού', 'ρυθμισεισ λογαριασμου', ['ρυθμισεισ', 'λογαριασμου']],
    ['ar', 'كيف أضيف صورة إلى التقرير اليومي؟', 'كيف أضيف صورة إلى التقرير اليومي', ['أضيف', 'صورة', 'التقرير', 'اليومي']],
    ['ar', 'تغيير كلمة المرور', 'تغيير كلمة المرور', ['تغيير', 'كلمة', 'المرور']],
    ['he', 'איך מוסיפים תמונה לדוח היומי?', 'איך מוסיפים תמונה לדוח היומי', ['מוסיפים', 'תמונה', 'לדוח', 'היומי']],
    ['he', 'שינוי סיסמה', 'שינוי סיסמה', ['שינוי', 'סיסמה']],
    // Sinais de vogal opcionais (harakat e tatweel do árabe, niqqud do hebraico): somem, dos dois lados. As letras
    // com hamza ou madda (أ إ آ ؤ ئ) ficam; o maqaf hebraico (־) separa palavras.
    ['ar', 'أَضِفْ صُوَرًا إِلَى التَّقْرِيرِ اليَوْمِيِّ', 'أضف صورا إلى التقرير اليومي', ['أضف', 'صورا', 'التقرير', 'اليومي']],
    ['ar', 'صورًا', 'صورا', ['صورا']],
    ['ar', 'تـغـيـيـر كَلِمَةِ المُرُورِ', 'تغيير كلمة المرور', ['تغيير', 'كلمة', 'المرور']],
    ['ar', 'آخِر تقرير مُؤَرَّخ', 'آخر تقرير مؤرخ', ['آخر', 'تقرير', 'مؤرخ']],
    ['he', 'אֵיךְ מוֹסִיפִים תְּמוּנָה לַדּוֹחַ הַיּוֹמִי?', 'איך מוסיפים תמונה לדוח היומי', ['מוסיפים', 'תמונה', 'לדוח', 'היומי']],
    ['he', 'שִׁינּוּי סִיסְמָה', 'שינוי סיסמה', ['שינוי', 'סיסמה']],
    ['he', 'בֵּית־סֵפֶר', 'בית ספר', ['בית', 'ספר']],
    ['he', '\uFB2Aלום', 'שלום', ['שלום']],
    ['hi', 'दैनिक रिपोर्ट में फ\u093Cोटो कैसे जोड\u093Cें?', 'दैनिक रिपोर्ट में फ\u093Cोटो कैसे जोड\u093Cें', ['दैनिक', 'रिपोर्ट', 'फ़ोटो', 'जोड़ें']],
    ['hi', '\u095Eोटो जो\u095Cें', 'फ\u093Cोटो जोड\u093Cें', ['फ़ोटो', 'जोड़ें']],
    ['hi', 'पासवर्ड बदलें', 'पासवर्ड बदलें', ['पासवर्ड', 'बदलें']],
    ['th', 'เพิ่มรูปภาพในรายงาน', 'เพิ่มรูปภาพในรายงาน', ['เพ', 'พิ', 'ิ่', '่ม', 'มร', 'รู', 'ูป', 'ปภ', 'ภา', 'าพ', 'รา', 'าย', 'ยง', 'งา', 'าน']],
    ['th', 'รายงาน PDF', 'รายงาน pdf', ['รา', 'าย', 'ยง', 'งา', 'าน', 'pdf']],
    ['ja', '日報に写真を追加する方法', '日報に写真を追加する方法', ['日報', '写真', '追加']],
    ['ja', 'パスワードを変更', 'パスワードを変更', ['パス', 'スワ', 'ワー', 'ード', '変更']],
    ['ja', 'RDOのPDF', 'rdoのpdf', ['rdo', 'pdf']],
    ['zh-TW', '如何在日報中新增照片？', '如何在日報中新增照片', ['在日', '日報', '報中', '中新', '新增', '增照', '照片']],
    ['zh-TW', '密碼', '密碼', ['密碼']],
    ['zh-TW', '圖', '圖', ['圖']],
    ['ko', '일일 보고서에 사진을 추가하는 방법', '일일 보고서에 사진을 추가하는 방법', ['일일', '보고서에', '사진을', '추가하는']],
    ['ko', '비밀번호 변경', '비밀번호 변경', ['비밀번호', '변경']],
];

test('outras escritas: normaliza e separa os termos da consulta', () => {
    for (const [idioma, texto, normalizado, termos] of ESCRITAS) {
        assert.equal(normalizar(texto), normalizado, `${idioma}: ${texto}`);
        assert.deepEqual(termosDaConsulta(texto, idioma), termos, `${idioma}: ${texto}`);
    }
});

test('tira só os acentos U+0300–U+036F e deixa letra, marca e número de qualquer escrita', () => {
    assert.equal(normalizar('Ά ΐ ώ й Ё ї'), 'α ι ω и е і');
    assert.equal(normalizar('ΟΔΟΣ οδός'), 'οδοσ οδοσ');
    assert.equal(normalizar('\u212A \u2126 \uF900'), 'k ω \u8C48');
    assert.equal(normalizar('\u0958 क\u093C'), 'क\u093C क\u093C');
    assert.equal(normalizar('Custo por m² — 2º andar'), 'custo por m² 2º andar');
    assert.equal(normalizar('한국어'), '한국어');
    assert.equal(normalizar('\u1112\u1161\u11AB'), '한');
});

const OUTRAS = prepararBusca([
    { id: 'foto-ru', titulo: 'Как добавить фото в ежедневный отчёт', tags: ['снимок'], prioritario: false },
    { id: 'conta-el', titulo: 'Ρυθμίσεις λογαριασμού', tags: ['κωδικός'], prioritario: false },
    { id: 'senha-ja', titulo: 'パスワードを変更する', tags: ['ログイン'], prioritario: false },
    { id: 'foto-zh', titulo: '在日報中新增照片', tags: ['相片'], prioritario: false },
    { id: 'foto-th', titulo: 'เพิ่มรูปภาพในรายงานประจำวัน', tags: ['ภาพถ่าย'], prioritario: false },
    { id: 'senha-ko', titulo: '비밀번호 변경하기', tags: ['로그인'], prioritario: false },
], null);

test('outras escritas: acha sem acento, sem maiúscula e por pedaço, sem exigir todos os termos', () => {
    assert.deepEqual(ids(buscar(OUTRAS, 'ОТЧЕТ')), ['foto-ru']);
    assert.deepEqual(ids(buscar(OUTRAS, 'отчёт фото')), ['foto-ru']);
    assert.deepEqual(ids(buscar(OUTRAS, 'ΡΥΘΜΙΣΕΙΣ')), ['conta-el']);
    assert.deepEqual(ids(buscar(OUTRAS, 'ρυθμισεις λογαριασμου')), ['conta-el']);
    assert.deepEqual(ids(buscar(OUTRAS, 'パスワード')), ['senha-ja']);
    assert.deepEqual(ids(buscar(OUTRAS, '新增照片')), ['foto-zh']);
    assert.deepEqual(ids(buscar(OUTRAS, '刪除照片')), ['foto-zh'], 'tolerante: "照片" basta');
    assert.deepEqual(ids(buscar(OUTRAS, '刪除帳號')), []);
    assert.deepEqual(ids(buscar(OUTRAS, 'รูปภาพ')), ['foto-th']);
    assert.deepEqual(ids(buscar(OUTRAS, 'รายงาน ภาพถ่าย')), ['foto-th']);
    assert.deepEqual(ids(buscar(OUTRAS, '비밀번호')), ['senha-ko']);
    assert.deepEqual(ids(buscar(OUTRAS, '비밀')), ['senha-ko']);
});

// Índices de exemplo em árabe e hebraico: os mesmos do campo "exemplos" de ajuda/testes/busca_casos.json
// (gestao_obras), com as consultas e os artigos esperados (o app tem de achar os mesmos).
const EXEMPLOS = [
    {
        idioma: 'ar',
        artigos: [
            { id: 'exemplo-fotos', titulo: 'إضافة صورة إلى التقرير اليومي', resumo: 'أرفق صُوَرًا بالتقرير.', tags: ['صور', 'تقرير'], busca: 'كاميرا مَعرض' },
            { id: 'exemplo-senha', titulo: 'تَغْيِيرُ كَلِمَةِ المُرُورِ', resumo: 'غيّر كلمة المرور من الإعدادات.', tags: ['أمان'], busca: '' },
            { id: 'exemplo-relatorio', titulo: 'تـقـريـر بصيغة PDF', resumo: 'شارك التقرير.', tags: [], busca: '' },
        ],
        consultas: [
            ['صورا', ['exemplo-fotos']], ['صورًا', ['exemplo-fotos']], ['صُوَر', ['exemplo-fotos']],
            ['كلمة المرور', ['exemplo-senha']], ['كَلِمَة المُرُور', ['exemplo-senha']], ['غير', ['exemplo-senha']],
            ['تقرير', ['exemplo-relatorio', 'exemplo-fotos']], ['معرض', ['exemplo-fotos']],
            ['أمان', ['exemplo-senha']], ['امان', []],
        ],
    },
    {
        idioma: 'he',
        artigos: [
            { id: 'exemplo-fotos', titulo: 'הוספת תמונה לדוח היומי', resumo: 'מצרפים תְּמוּנוֹת לַדּוֹחַ.', tags: ['תמונות'], busca: 'מצלמה' },
            { id: 'exemplo-senha', titulo: 'שִׁינּוּי סִיסְמָה', resumo: 'מחליפים סיסמה בהגדרות.', tags: ['אבטחה'], busca: '' },
            { id: 'exemplo-escola', titulo: 'בית־ספר', resumo: 'דוגמה עם מקף.', tags: [], busca: '' },
        ],
        consultas: [
            ['תמונות', ['exemplo-fotos']], ['תְּמוּנוֹת', ['exemplo-fotos']], ['דוח', ['exemplo-fotos']],
            ['סיסמה', ['exemplo-senha']], ['שינוי סִיסְמָה', ['exemplo-senha']],
            ['ספר', ['exemplo-escola']], ['בית ספר', ['exemplo-escola']],
        ],
    },
];

test('árabe e hebraico: com e sem os sinais de vogal, no artigo e na consulta, acha o mesmo artigo', () => {
    for (const { idioma, artigos, consultas } of EXEMPLOS) {
        const indice = prepararBusca(artigos, idioma);
        for (const [consulta, esperado] of consultas) assert.deepEqual(ids(buscar(indice, consulta)), esperado, consulta);
    }
    // A letra com hamza é outra letra (não vira ا); o ponto do shin e o dagesh das formas prontas somem.
    assert.equal(normalizar('أ إ آ ؤ ئ'), 'أ إ آ ؤ ئ');
    assert.equal(normalizar('\uFB2Aלום \uFB31ית'), 'שלום בית');
});

test('texto: negrito, link para artigo e lista', () => {
    const blocos = lerTexto('Toque em **Salvar**.\n- veja [o cadastro](artigo:cadastrar-colaborador)\n- fim');
    assert.equal(blocos.length, 2);
    assert.deepEqual(blocos[0], {
        tipo: 'paragrafo',
        pedacos: [
            { tipo: 'texto', texto: 'Toque em ', negrito: false },
            { tipo: 'texto', texto: 'Salvar', negrito: true },
            { tipo: 'texto', texto: '.', negrito: false },
        ],
    });
    assert.equal(blocos[1].tipo, 'lista');
    assert.equal(blocos[1].itens.length, 2);
    assert.deepEqual(blocos[1].itens[0][1], { tipo: 'link', texto: 'o cadastro', id: 'cadastrar-colaborador', negrito: false });
});

test('texto: nada vira HTML nem link de fora', () => {
    const [p] = lerTexto('<img src=x onerror=alert(1)> [clique](https://site.com) [ok](artigo:Maiuscula)');
    assert.ok(p.pedacos.every((x) => x.tipo === 'texto'));
    assert.equal(p.pedacos.map((x) => x.texto).join(''), '<img src=x onerror=alert(1)> [clique](https://site.com) ok');
});

test('texto: "**" sem par aparece como texto', () => {
    const pedacos = lerLinha('a **b** c **d');
    assert.deepEqual(pedacos.map((x) => [x.texto, x.negrito]), [['a ', false], ['b', true], [' c **d', false]]);
});

test('idiomas: idioma dos artigos para cada idioma do site', () => {
    for (const i of IDIOMAS_AJUDA) assert.equal(idiomaDoConteudo(i), i);
    // Idioma que o site ainda não tem (ou endereço estranho): inglês.
    assert.equal(idiomaDoConteudo('sv-SE'), 'en-US');
    assert.equal(idiomaDoConteudo(undefined), 'en-US');
});

test('idiomas: os 29 idiomas do site têm os artigos próprios (nenhum cai em outro idioma)', () => {
    assert.equal(IDIOMAS_AJUDA.length, 29);
    assert.equal(new Set(IDIOMAS_AJUDA).size, IDIOMAS_AJUDA.length);
    assert.deepEqual([...IDIOMAS_AJUDA].sort(), [...CODIGOS].sort());
    for (const c of CODIGOS) assert.equal(idiomaDoConteudo(c), c, c);
});

// Frases naturais dos 29 idiomas (as do assunto do chamado e da busca da Central), sobre um índice menor de cada
// idioma, com o resultado da busca de referência do gestao_obras: busca_casos.json, cópia de ajuda/testes/busca_site.json
// de lá (gerado por node bin/gerar-copia-app.mjs). A primeira do alemão é a dos prints de 15/11/2026, que antes não
// achava nada.
const CASOS_DO_APP = JSON.parse(readFileSync(new URL('./busca_casos.json', import.meta.url), 'utf8'));

test('frases naturais nos 29 idiomas: o mesmo resultado da referência e um artigo certo entre os 3 primeiros', () => {
    const idiomas = Object.entries(CASOS_DO_APP.idiomas);
    assert.equal(idiomas.length, 29);
    for (const [idioma, { artigos, frases }] of idiomas) {
        const indice = prepararBusca(artigos, idioma);
        for (const { frase, espera, esperado } of frases) {
            const achados = ids(buscar(indice, frase, { limite: 8 }));
            assert.deepEqual(achados, esperado, `${idioma}: ${frase}`);
            assert.ok(achados.slice(0, 3).some((id) => espera.includes(id)), `${idioma}: "${frase}" → ${achados.join(', ')}`);
        }
    }
    const de = CASOS_DO_APP.idiomas['de-DE'];
    assert.equal(ids(buscar(prepararBusca(de.artigos, 'de-DE'), 'Fotos des Bautagesberichts fehlen im PDF'))[0], 'pdf-do-rdo');
});
