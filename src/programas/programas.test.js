// Programa Influenciadores ObraFácil (piloto, só pt-BR): a cópia do regulamento é a do gestao_obras (impressão
// digital), os números da página estão escritos no regulamento, os endereços só existem no pt-BR e a cabeça das
// páginas prontas aponta só para elas mesmas.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import i18next from 'i18next';
import {
    CODIGOS, IDIOMAS, REFERENCIA, analisarCaminho, cadeia, caminhoPrograma, caminhoRegulamentoDoPrograma, idiomasDoPrograma,
} from '../i18n/idiomas.js';
import { lerTexto, tituloDoTexto } from '../legal/markdown.js';
import { cabecaDaPagina } from '../seo/cabeca.js';
import { alternativosDaPagina, indexavel } from '../seo/paginas.js';
import {
    ACEITE, ARQUIVO_DO_REGULAMENTO, CICLOS, CONTA, DIAS_DO_CICLO, DIAS_NO_AR, DIRECT, HASH, MINIMO_PUBLICACOES, MINIMO_SEGUIDORES,
    NIVEIS, PALAVRA, PERFIL, PONTOS, PONTOS_POR_MES, VAGAS, VALIDADE_MESES, VERSAO,
} from './influenciadores.js';

const texto = fs.readFileSync(new URL(`./${ARQUIVO_DO_REGULAMENTO}`, import.meta.url), 'utf8');

const resources = {};
for (const { codigo } of IDIOMAS) {
    resources[codigo] = { translation: JSON.parse(fs.readFileSync(new URL(`../i18n/textos/${codigo}.json`, import.meta.url), 'utf8')) };
}
const i18n = i18next.createInstance();
i18n.init({
    resources, lng: REFERENCIA, supportedLngs: CODIGOS, fallbackLng: (c) => cadeia(c).slice(1), load: 'currentOnly',
    returnEmptyString: false, interpolation: { escapeValue: false }, initAsync: false, showSupportNotice: false,
});

test('A cópia do regulamento é a versão 1.0 do gestao_obras, byte a byte (impressão digital)', () => {
    // O mesmo sha256 que "node bin/validar.mjs" (gestao_obras/ferramentas/programas) imprime para influenciadores 1.0 pt_BR.
    assert.equal(crypto.createHash('sha256').update(texto, 'utf8').digest('hex'), HASH);
    assert.equal(VERSAO, '1.0');
    assert.match(ARQUIVO_DO_REGULAMENTO, new RegExp(`-${VERSAO.replace('.', '\\.')}\\.pt-BR\\.md$`));
    assert.ok(texto.endsWith('\n') && !texto.endsWith('\n\n') && !/\r/.test(texto), 'texto normalizado como no validador');
    assert.equal(tituloDoTexto(lerTexto(texto)), 'Regulamento — Influenciadores ObraFácil');
});

test('Os números e as palavras da página estão escritos no regulamento', () => {
    const n = (v) => v.toLocaleString('pt-BR');
    for (const trecho of [
        `**${VAGAS} vagas**`, `**${CICLOS} ciclos de ${DIAS_DO_CICLO} dias**`, `**${n(MINIMO_SEGUIDORES)} seguidores ou mais** e **${MINIMO_PUBLICACOES} publicações ou mais**`,
        `**${PONTOS_POR_MES} pontos valem 1 mês do PRO.**`, `vale **${VALIDADE_MESES} meses**`, `por ${DIAS_NO_AR} dias`, `@${CONTA}`,
        `**${PALAVRA}**`, `**${ACEITE}**`,
    ]) assert.ok(texto.includes(trecho), `o regulamento não tem: ${trecho}`);
    const reels = PONTOS.find((p) => p.id === 'reels');
    assert.ok(texto.includes(`**Reels:** ${reels.pontos} pontos cada, até ${reels.limite[0]} por ciclo no nível Influenciador, ${reels.limite[1]} no Influenciador Pro e ${reels.limite[2]} no Embaixador`));
    const linha = { post: '**Post no feed** (foto ou carrossel): {p} pontos cada, até {l} por ciclo', story: '**Story:** {p} pontos cada, até {l} por ciclo',
        meta: '**Meta do ciclo:** {p} pontos', indicacao: '**Indicação** (seção 8): {p} pontos cada, até {l} por ciclo', repost: '(seção 10): {p} pontos, até {l} por ciclo' };
    for (const p of PONTOS.filter((x) => x.id !== 'reels')) {
        const esperado = linha[p.id].replace('{p}', p.pontos).replace('{l}', p.limite);
        assert.ok(texto.includes(esperado), `o regulamento não tem: ${esperado}`);
    }
    assert.ok(texto.includes(`**${NIVEIS[0].teto} pontos** no nível Influenciador, **${NIVEIS[1].teto}** no Influenciador Pro e **${NIVEIS[2].teto}** no Embaixador`));
    assert.ok(texto.includes(`de ${n(NIVEIS[0].de)} a ${n(NIVEIS[0].ate)} seguidores`) && texto.includes(`de ${n(NIVEIS[1].de)} a ${n(NIVEIS[1].ate)} seguidores`));
    assert.ok(texto.includes(`${n(NIVEIS[2].de)} seguidores ou mais`));
});

test('Endereços: só no pt-BR; nos outros idiomas o endereço é página inexistente', () => {
    assert.deepEqual(idiomasDoPrograma('influenciadores'), ['pt-BR']);
    assert.equal(caminhoPrograma('pt-BR', 'influenciadores'), '/pt-br/influenciadores');
    assert.equal(caminhoRegulamentoDoPrograma('pt-BR', 'influenciadores'), '/pt-br/influenciadores/regulamento');
    for (const c of CODIGOS.filter((x) => x !== 'pt-BR')) {
        assert.equal(caminhoPrograma(c, 'influenciadores'), null, c);
        assert.equal(analisarCaminho(`/${c.toLowerCase()}/influenciadores`).pagina, 'nao-encontrado', c);
    }
    assert.deepEqual(analisarCaminho('/pt-br/influenciadores'), { tipo: 'pagina', codigo: 'pt-BR', pagina: 'programa', programa: 'influenciadores', canonico: null });
    assert.equal(analisarCaminho('/pt-br/influenciadores/regulamento').pagina, 'regulamento-programa');
    assert.equal(analisarCaminho('/PT-BR/Influenciadores/Regulamento').canonico, '/pt-br/influenciadores/regulamento');
    assert.equal(analisarCaminho('/pt-br/influenciadores/outra-coisa').pagina, 'nao-encontrado');
    assert.throws(() => caminhoPrograma('pt-BR', 'afiliados'), /Programa desconhecido/);
});

test('Links oficiais do Instagram: o direct (ig.me) e o perfil, sem script de fora', () => {
    assert.equal(DIRECT, 'https://ig.me/m/oficial.obrafacil');
    assert.equal(PERFIL, 'https://www.instagram.com/oficial.obrafacil/');
});

test('Cabeça das páginas prontas: indexáveis, hreflang só do pt-BR, título e descrição do programa', () => {
    const t = i18n.getFixedT('pt-BR');
    const programa = { tipo: 'programa', codigo: 'pt-BR', programa: 'influenciadores' };
    const regulamento = { tipo: 'regulamento-programa', codigo: 'pt-BR', programa: 'influenciadores' };
    assert.ok(indexavel(programa) && indexavel(regulamento));
    assert.deepEqual(alternativosDaPagina(programa), [{ hreflang: 'pt-BR', href: 'https://appobrafacil.expertbr.com/pt-br/influenciadores' }]);
    const c = cabecaDaPagina({ t, pagina: programa });
    assert.equal(c.titulo, 'Influenciadores ObraFácil: ganhe meses do PRO');
    assert.ok(c.descricao.length > 50 && c.descricao.length <= 160, c.descricao);
    const r = cabecaDaPagina({ t, pagina: regulamento, dados: { titulo: tituloDoTexto(lerTexto(texto)) } });
    assert.equal(r.titulo, 'Regulamento — Influenciadores ObraFácil · ObraFácil');
    assert.equal(r.url, 'https://appobrafacil.expertbr.com/pt-br/influenciadores/regulamento');
    assert.ok(r.descricao.length <= 160);
});

test('Textos do programa: só no pt-BR (nenhum outro idioma tem a chave influenciadores)', () => {
    for (const { codigo } of IDIOMAS) {
        const tem = 'influenciadores' in resources[codigo].translation;
        assert.equal(tem, codigo === 'pt-BR', codigo);
    }
    const t = i18n.getFixedT('pt-BR');
    assert.equal(t('influenciadores.limite', { count: 1 }), '1 vez');
    assert.equal(t('influenciadores.limite', { count: 8 }), '8 vezes');
});
