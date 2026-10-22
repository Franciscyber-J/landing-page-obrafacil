// O bloco de idiomas do .htaccess está em dia com src/i18n/registro.js e escolhe o idioma do navegador igual
// ao site (escolherIdioma), e os endereços antigos têm regra em todos os idiomas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDIOMAS, INTERNACIONAL, PAGINAS_ANTIGAS, escolherIdioma } from '../../src/i18n/idiomas.js';
import { ARQUIVO, blocoAtual, gerarBloco, regrasDoNavegador } from './htaccess.mjs';

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

test('.htaccess sem o WordPress e com as regras das páginas prontas', () => {
    assert.doesNotMatch(htaccess, /BEGIN WordPress|LSCACHE|xmlrpc|index\.php/);
    assert.match(htaccess, /DirectorySlash Off/);
    assert.match(htaccess, /RewriteCond %1\.html -f\nRewriteRule \^\(\[a-z\]\{2\}-\[a-z\]\{2\}\/\.\+\)\$ \/\$1\.html \[L\]/);
    // A barra no fim sai antes da regra das páginas prontas, e a regra do site (index.html) vem por último.
    const ordem = ['index\\.html[\\s?]', '# >>> ENDEREÇOS POR IDIOMA', 'RewriteRule ^([a-z]{2}-[a-z]{2}/.+)/$', 'RewriteCond %1.html -f', 'RewriteRule ^(ajuda(/.*)?|'];
    const posicoes = ordem.map((t) => htaccess.indexOf(t));
    assert.ok(posicoes.every((p) => p >= 0), JSON.stringify(posicoes));
    assert.deepEqual([...posicoes].sort((a, b) => a - b), posicoes);
});
