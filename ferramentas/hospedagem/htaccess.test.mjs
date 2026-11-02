// O bloco de idiomas do .htaccess está em dia com src/i18n/registro.js e escolhe o idioma do navegador igual
// ao site (escolherIdioma), e os endereços antigos têm regra em todos os idiomas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDIOMAS, INTERNACIONAL, PAGINAS_ANTIGAS, escolherIdioma } from '../../src/i18n/idiomas.js';
import { ARQUIVO, blocoAtual, gerarBloco, regrasDoNavegador, regrasDosAntigos } from './htaccess.mjs';
import {
    ARTIGOS_RETIRADOS, ASSUNTOS_RENOMEADOS, caminhoDoAssuntoAntigo, caminhoDoAssuntoNovo, caminhosDoArtigoRetirado,
} from '../../src/ajuda/antigos.js';

const htaccess = fs.readFileSync(ARQUIVO, 'utf8');

test('hospedagem/.htaccess com o bloco dos idiomas em dia (senão: npm run htaccess)', () => {
    assert.equal(blocoAtual(htaccess), gerarBloco());
});

// O que o Apache/LiteSpeed escolhe: a primeira regra do bloco que casa com o cabeçalho; nenhuma = sem idioma.
function escolhaDoServidor(cabecalho) {
    for (const [codigo, padrao] of regrasDoNavegador()) if (new RegExp(padrao, 'i').test(cabecalho)) return codigo;
    return null;
}

// O site recebe navigator.languages (a mesma lista, sem os ;q=).
const doCabecalho = (cabecalho) => cabecalho.split(',').map((p) => p.split(';')[0].trim()).filter(Boolean);

test('idioma do navegador: o servidor escolhe igual ao site', () => {
    const casos = [
        'pt-BR,pt;q=0.9,en;q=0.8', 'pt', 'pt-PT', 'pt-AO,pt;q=0.9', 'pt-MZ', 'PT-br', 'en-US,en;q=0.9', 'en', 'en-GB',
        'en-IE', 'en-IN,hi;q=0.9', 'en-AU', 'en-NZ', 'en-CA,fr-CA;q=0.8', 'en-ZA', 'en-PH', 'es', 'es-ES', 'es-MX',
        'es-AR,es;q=0.9', 'es-419', 'es-US', 'es-CO', 'de-DE,de;q=0.9,pt;q=0.8', 'fr-FR,fr;q=0.9,es-CL;q=0.7',
        'ja-JP,ja;q=0.9,en-US;q=0.8', 'zh-CN', '*', 'de-DE', 'fr-CA,en-CA;q=0.9', 'pt-br;q=0.9', ' es-AR , en;q=0.5',
        'english,pt', 'esperanto', 'en-Latn-US', 'pt-BR-x-teste',
    ];
    for (const caso of casos) {
        const site = escolherIdioma(doCabecalho(caso));
        const servidor = escolhaDoServidor(caso) ?? INTERNACIONAL; // sem idioma conhecido, a raiz usa o inglês
        assert.equal(servidor, site, `Accept-Language "${caso}"`);
    }
});

test('raiz e endereços antigos: uma regra para cada idioma do registro', () => {
    const bloco = gerarBloco();
    for (const i of IDIOMAS) {
        assert.ok(bloco.includes(`E=IDIOMA_NAVEGADOR:${i.codigo.toLowerCase()}]`), `${i.codigo}: escolha pelo navegador`);
        for (const antigo of ['termos-de-uso', 'politicas-de-privacidade', 'ajuda', ...Object.keys(PAGINAS_ANTIGAS)]) {
            const linhas = bloco.split('\n');
            const n = linhas.findIndex((l, k) => l === `RewriteCond %{ENV:IDIOMA_NAVEGADOR} =${i.codigo.toLowerCase()}` && linhas[k + 1].startsWith(`RewriteRule ^${antigo.replace(/-/g, '\\-')}/?$ `));
            assert.ok(n >= 0, `${antigo} em ${i.codigo}`);
        }
    }
    // Volta do pagamento e Perfil não levam o ?session_id adiante; Termos e Suporte mantêm o ?utm_.
    assert.match(bloco, /\^pagamento\\-ok\/\?\$ \/pt-br\/pagamento-confirmado\/acesso-cliente\? \[/);
    assert.match(bloco, /\^perfil\/\?\$ \/en-us\/profile\? \[/);
    assert.match(bloco, /\^suporte\/\?\$ \/es-es\/soporte \[/);
    assert.match(bloco, /\^termos\\-de\\-uso\/\?\$ \/pt-pt\/termos-de-utilizacao \[NC,R=301/);
    assert.match(bloco, /RewriteRule \^\$ \/%1\/ \[R=302/);
});

test('.htaccess sem o WordPress e com as regras das páginas prontas, na ordem certa', () => {
    assert.doesNotMatch(htaccess, /BEGIN WordPress|LSCACHE|xmlrpc|index\.php/);
    assert.match(htaccess, /DirectorySlash Off/);
    assert.match(htaccess, /Options -Indexes -MultiViews/);
    assert.match(htaccess, /RewriteCond %1\.html -f\nRewriteRule \^\(\[a-z\]\{2\}-\[a-z\]\{2\}\/\.\+\)\$ \/\$1\.html \[L\]/);
    // Pasta velha sem barra abre o site; /pt-br/ (com barra) continua no pt-br/index.html.
    assert.ok(htaccess.includes('RewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_URI} !/$ [OR]\nRewriteCond %{REQUEST_FILENAME}/index.html !-f\nRewriteRule ^(ajuda(/.*)?|'));
    const ordem = ['index\\.html[\\s?]', '# >>> ENDEREÇOS POR IDIOMA', 'RewriteRule ^([a-z]{2}-[a-z]{2}/.+)/$', 'RewriteCond %1.html -f', 'RewriteRule ^(ajuda(/.*)?|', '# <<< ENDEREÇOS POR IDIOMA'];
    const posicoes = ordem.map((t) => htaccess.indexOf(t));
    assert.ok(posicoes.every((p) => p >= 0), JSON.stringify(posicoes));
    assert.deepEqual([...posicoes].sort((a, b) => a - b), posicoes);
});

// Endereço antigo: idioma do navegador; sem cabeçalho nenhum (robôs) pt-BR; com idioma fora do site, inglês.
function antigoDoServidor(cabecalho) {
    for (const [codigo, padrao] of regrasDoNavegador()) if (new RegExp(padrao, 'i').test(cabecalho)) return codigo;
    return /^\s*$/.test(cabecalho) ? 'pt-BR' : INTERNACIONAL;
}

test('endereços antigos: sem Accept-Language vai para pt-BR; com idioma fora do site, inglês (como a raiz)', () => {
    assert.equal(antigoDoServidor(''), 'pt-BR');
    assert.equal(antigoDoServidor('sv-SE,sv;q=0.9'), 'en-US');
    assert.equal(antigoDoServidor('*'), 'en-US');
    assert.equal(antigoDoServidor('pt-BR,pt;q=0.9'), 'pt-BR');
    assert.equal(antigoDoServidor('es-AR'), 'es-MX');
    const bloco = gerarBloco();
    assert.ok(bloco.includes('RewriteCond %{HTTP:Accept-Language} ^\\s*$\nRewriteRule ^.+$ - [E=IDIOMA_NAVEGADOR:pt-br]'));
    assert.ok(bloco.includes('RewriteCond %{ENV:IDIOMA_NAVEGADOR} ^$\nRewriteRule ^.+$ - [E=IDIOMA_NAVEGADOR:en-us]'));
});

// Central: endereços que estiveram no ar e mudaram (src/ajuda/antigos.js). O servidor compara o endereço sem a barra
// do começo; as regras são testadas com as expressões do próprio .htaccess.
function regrasDaCentral() {
    return regrasDosAntigos().map((r) => {
        const [, padrao, destino, opcoes] = /^RewriteRule (\S+) (\S+) \[([^\]]+)\]$/.exec(r);
        return { padrao: new RegExp(padrao), destino, opcoes };
    });
}
function respostaDaCentral(caminho) {
    const regra = regrasDaCentral().find((r) => r.padrao.test(caminho.slice(1)));
    if (!regra) return null;
    return regra.opcoes === 'G' ? { status: 410 } : { status: 301, destino: regra.destino };
}

test('Central: assunto renomeado vai com 301 para o endereço novo; artigo retirado responde 410', () => {
    for (const a of ASSUNTOS_RENOMEADOS) {
        assert.deepEqual(respostaDaCentral(caminhoDoAssuntoAntigo(a)), { status: 301, destino: caminhoDoAssuntoNovo(a) }, a.antigo);
        assert.equal(respostaDaCentral(caminhoDoAssuntoNovo(a)), null, 'o endereço novo não é tocado');
    }
    for (const a of ARTIGOS_RETIRADOS) {
        for (const c of caminhosDoArtigoRetirado(a)) assert.deepEqual(respostaDaCentral(c), { status: 410 }, c);
    }
    assert.deepEqual(respostaDaCentral('/en-us/help/topic/calculators-and-estimates'), { status: 301, destino: '/en-us/help/topic/calculators' });
    assert.deepEqual(respostaDaCentral('/es-mx/ayuda/estimacion-cub'), { status: 410 });
    // O pt-BR continua com os artigos e com o nome do assunto; os outros endereços não são tocados.
    for (const caminho of [
        '/pt-br/ajuda/estimativa-cub', '/pt-br/ajuda/o-que-e-o-cub', '/pt-br/ajuda/assunto/calculadoras-e-estimativas',
        '/es-mx/ayuda/tema/reportes-diarios', '/en-us/help/create-daily-report', '/en-us/help/cub-cost-estimate-2',
        '/en-us/help/topic/calculators', '/fr-fr/aide/estimativa-cub', '/en-us/help/x/cub-cost-estimate',
    ]) assert.equal(respostaDaCentral(caminho), null, caminho);
});

test('Central: regras dos endereços antigos depois da barra no fim e antes das páginas prontas; 410 abre o site', () => {
    const bloco = gerarBloco();
    for (const r of regrasDosAntigos()) assert.ok(bloco.includes(`\n${r}\n`), r);
    const barra = bloco.indexOf('RewriteRule ^([a-z]{2}-[a-z]{2}/.+)/$');
    const prontas = bloco.indexOf('RewriteCond %1.html -f');
    const primeira = bloco.indexOf(regrasDosAntigos()[0]);
    const ultima = bloco.indexOf(regrasDosAntigos().at(-1));
    assert.ok(barra >= 0 && barra < primeira && ultima < prontas, JSON.stringify({ barra, primeira, ultima, prontas }));
    assert.match(htaccess, /^ErrorDocument 410 \/index\.html$/m);
});
