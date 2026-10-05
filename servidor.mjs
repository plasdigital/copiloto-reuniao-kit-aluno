// Copiloto de reunião — servidor local. Sem dependência: `node servidor.mjs` e abrir http://localhost:3030
//
// Por que existe servidor: a chave da OpenRouter nunca vai para o navegador. A página manda a frase,
// o servidor chama o Jev (cliente em jev.mjs, formato conferido em 23/set/2026).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decidir } from './jev.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORTA || 3030);
const ARQ_OBJECOES = path.join(AQUI, 'objecoes.json');
// Cada reunião vira um .json (para reabrir na página) e um .md (para ler ou mandar para a IA).
// A pasta é do dono e fica fora do git: tem a fala do cliente.
const PASTA_REUNIOES = path.join(AQUI, 'reunioes');

const FASES = {
  abertura: 'cumprimentos, apresentação, quebra-gelo, combinar a pauta da reunião',
  dor: 'o cliente conta o negócio dele, os problemas, o que perde, como funciona hoje',
  apresentacao: 'o vendedor mostra a solução, como funciona, o que entrega, prazo e preço',
  objecao: 'o cliente resiste, levanta dúvida ou impedimento para fechar',
  fechamento: 'combinar pagamento, contrato, início, próximos passos da compra',
};

const lerObjecoes = () => JSON.parse(fs.readFileSync(ARQ_OBJECOES, 'utf8'));

function perguntas(objecoes) {
  const criterios = Object.fromEntries(objecoes.map((o) => [o.id, o.quando]));
  criterios.nenhuma = 'a frase não se encaixa em nenhuma das objeções acima';
  return {
    tem_objecao: {
      type: 'noul',
      instructions: 'Nesta última frase o CLIENTE está levantando uma objeção, resistência ou impedimento para fechar a compra?',
    },
    objecao: {
      type: 'choice',
      instructions: 'Qual objeção o cliente levantou na última frase?',
      criteria: criterios,
    },
    dor: {
      type: 'noul',
      instructions: 'Nesta última frase o cliente está contando uma dor, problema ou prejuízo do negócio dele?',
    },
    fase: {
      type: 'choice',
      instructions: 'Em que fase da reunião de vendas a conversa está agora?',
      criteria: FASES,
    },
    terminou: {
      type: 'noul',
      instructions: 'A última frase do cliente está completa, com o raciocínio terminado (não foi cortada no meio)?',
    },
  };
}

async function corpoJson(req) {
  let s = '';
  for await (const pedaco of req) s += pedaco;
  return s ? JSON.parse(s) : {};
}

function responder(res, status, dado, tipo = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': tipo, 'Cache-Control': 'no-store' });
  res.end(typeof dado === 'string' || Buffer.isBuffer(dado) ? dado : JSON.stringify(dado));
}

async function rotaDecidir(req, res) {
  const { frase, recente = [] } = await corpoJson(req);
  if (!frase || !frase.trim()) return responder(res, 400, { erro: 'frase vazia' });
  const { objecoes, contexto } = lerObjecoes();
  const state = {
    ultima_frase_do_cliente: frase.trim(),
    conversa_recente: recente.slice(-8).map((f) => `${f.quem}: ${f.texto}`).join('\n'),
    contexto: contexto || 'Reunião de vendas por vídeo.',   // o que você vende: campo "contexto" do objecoes.json
  };
  try {
    const r = await decidir({ state, questions: perguntas(objecoes) });
    const a = r.answers;
    const pct = (x) => `${Math.round((x ?? 0) * 100)}%`;
    console.log(`${new Date().toLocaleTimeString('pt-BR')}  ${r.ms} ms  objeção ${pct(a.tem_objecao?.noul)} → ${a.objecao?.choice} ${pct(a.objecao?.confidence)} · dor ${pct(a.dor?.noul)} · fase ${a.fase?.choice}  "${frase.trim().slice(0, 70)}"`);
    responder(res, 200, { answers: a, ms: r.ms, custo: r.usage?.cost ?? null });
  } catch (e) {
    console.error(new Date().toISOString(), e.message);
    responder(res, 502, { erro: e.message });
  }
}

// ---------- transcrição: duas opções, escolhidas na página
// Chrome (grátis): a página usa a transcrição do próprio Chrome e o servidor não participa.
// OpenAI (gpt-live-transcribe, ~US$ 1 por hora): a página pede aqui uma senha temporária (vale ~1 min para
// abrir a conexão) e manda o áudio direto para a OpenAI por WebRTC. A chave de verdade fica no servidor.
// Formato conferido contra a API em 05/out/2026. Sem chave, a opção OpenAI aparece desligada na página.
const ARQ_CHAVE_OPENAI = path.join(AQUI, '.env.local');

function chaveOpenAI() {
  const m = fs.existsSync(ARQ_CHAVE_OPENAI) && fs.readFileSync(ARQ_CHAVE_OPENAI, 'utf8').match(/^OPENAI_API_KEY=(.+)$/m);
  return m && m[1].trim() ? m[1].trim() : null;
}

async function rotaTranscricao(req, res) {
  if (req.method === 'GET') return responder(res, 200, { openai: Boolean(chaveOpenAI()) });
  if (!chaveOpenAI()) return responder(res, 400, { erro: 'Sem OPENAI_API_KEY no .env.local (é opcional: só para a transcrição da OpenAI)' });
  const { contexto } = lerObjecoes();
  const sessao = { type: 'transcription', audio: { input: {
    format: { type: 'audio/pcm', rate: 24000 },
    transcription: {
      model: 'gpt-live-transcribe', languages: ['pt'], delay: 'low',
      prompt: `Reunião de vendas por vídeo, em português do Brasil. ${contexto || ''}`.slice(0, 500),
    },
    turn_detection: null,   // o modelo não aceita VAD: a página fecha cada frase pelo volume
  } } };
  try {
    const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chaveOpenAI()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessao }),
    });
    const d = await r.json();
    if (!d.value) throw new Error(d.error?.message || `OpenAI ${r.status}`);
    responder(res, 200, { value: d.value });
  } catch (e) {
    console.error(new Date().toISOString(), 'transcrição:', e.message);
    responder(res, 502, { erro: e.message });
  }
}

// ---------- reuniões salvas
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const NOME_FASE = { abertura: 'Abertura', dor: 'Dor', apresentacao: 'Apresentação', objecao: 'Objeção', fechamento: 'Fechamento' };
const pctMd = (x) => `${Math.round((x ?? 0) * 100)}%`;

function reuniaoEmMarkdown(r) {
  const ini = new Date(r.inicio), fim = new Date(r.fim || r.inicio);
  const min = Math.max(1, Math.round((fim - ini) / 60000));
  const md = [
    `# Reunião${r.cliente ? ` com ${r.cliente}` : ''} · ${ini.toLocaleDateString('pt-BR')} ${hora(r.inicio)}`,
    '',
    `- **Duração:** ${hora(r.inicio)} às ${hora(r.fim || r.inicio)} (${min} min)`,
    `- **Fase em que terminou:** ${NOME_FASE[r.fase] || '—'}`,
    `- **Decisões da IA:** ${r.decisoes || 0} · US$ ${(r.custo || 0).toFixed(5)}`,
    '',
    '## Objeções que apareceram',
    '',
    ...(r.cartoes?.length
      ? r.cartoes.map((c) => `- ${hora(c.hora)} **${c.nome}** (certeza ${pctMd(c.conf)}): "${c.frase}"`)
      : ['Nenhuma passou do corte.']),
    '',
    '## Dores que ele contou',
    '',
    ...(r.dores?.length ? r.dores.map((d) => `- ${hora(d.hora)} "${d.frase}"`) : ['Nenhuma anotada.']),
  ];
  if (r.notas?.trim()) md.push('', '## Suas notas', '', r.notas.trim());
  md.push('', '## Conversa', '', '_Entre parênteses: o cartão que apareceu, a dor anotada ou a objeção que a IA quase escolheu (abaixo do corte de 60%)._', '');
  let nomes = {};
  try { nomes = Object.fromEntries(lerObjecoes().objecoes.map((o) => [o.id, o.nome])); } catch {}
  for (const f of r.conversa || []) {
    const quase = f.jev && f.jev.objecao && f.jev.objecao !== 'nenhuma' && f.jev.certeza >= 0.3;
    const marca = f.cartao ? ` _(cartão: ${f.cartao})_`
      : f.dor ? ' _(dor anotada)_'
      : quase ? ` _(quase: ${nomes[f.jev.objecao] || f.jev.objecao} ${pctMd(f.jev.certeza)})_` : '';
    md.push(`[${hora(f.hora)}] **${f.quem}:** ${f.texto}${marca}  `);
  }
  return md.join('\n') + '\n';
}

function listarReunioes() {
  if (!fs.existsSync(PASTA_REUNIOES)) return [];
  return fs.readdirSync(PASTA_REUNIOES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const r = JSON.parse(fs.readFileSync(path.join(PASTA_REUNIOES, f), 'utf8'));
        return { id: r.id, cliente: r.cliente, inicio: r.inicio, fim: r.fim, falas: r.conversa?.length || 0, cartoes: (r.cartoes || []).map((c) => c.nome) };
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''));
}

const ID_VALIDO = /^[0-9A-Za-z_-]{1,60}$/;   // o id vira nome de arquivo: nada de "../"

async function rotaReunioes(req, res, url) {
  if (url.pathname === '/api/reunioes' && req.method === 'GET') return responder(res, 200, listarReunioes());
  let id = decodeURIComponent(url.pathname.slice('/api/reunioes/'.length));
  const querMd = id.endsWith('.md');
  if (querMd) id = id.slice(0, -3);
  if (!ID_VALIDO.test(id)) return responder(res, 400, { erro: 'id inválido' });
  const arq = path.join(PASTA_REUNIOES, `${id}.json`);
  if (req.method === 'GET' && querMd) {
    const md = path.join(PASTA_REUNIOES, `${id}.md`);
    if (!fs.existsSync(md)) return responder(res, 404, { erro: 'reunião não encontrada' });
    return responder(res, 200, fs.readFileSync(md, 'utf8'), 'text/markdown; charset=utf-8');
  }
  if (req.method === 'GET') {
    if (!fs.existsSync(arq)) return responder(res, 404, { erro: 'reunião não encontrada' });
    return responder(res, 200, fs.readFileSync(arq, 'utf8'));
  }
  if (req.method === 'PUT') {
    const r = { ...(await corpoJson(req)), id };
    fs.mkdirSync(PASTA_REUNIOES, { recursive: true });
    fs.writeFileSync(arq, JSON.stringify(r, null, 2) + '\n');
    fs.writeFileSync(path.join(PASTA_REUNIOES, `${id}.md`), reuniaoEmMarkdown(r));
    return responder(res, 200, { ok: true, arquivo: path.join(PASTA_REUNIOES, `${id}.md`) });
  }
  responder(res, 405, { erro: 'método não aceito' });
}

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return responder(res, 200, fs.readFileSync(path.join(AQUI, 'index.html')), 'text/html; charset=utf-8');
    }
    if (url.pathname === '/api/objecoes' && req.method === 'GET') return responder(res, 200, lerObjecoes());
    if (url.pathname === '/api/objecoes' && req.method === 'PUT') {
      const dado = await corpoJson(req);
      if (!Array.isArray(dado.objecoes)) return responder(res, 400, { erro: 'esperado { objecoes: [...] }' });
      const atual = lerObjecoes();
      fs.writeFileSync(ARQ_OBJECOES, JSON.stringify({ ...atual, objecoes: dado.objecoes }, null, 2) + '\n');
      return responder(res, 200, { ok: true });
    }
    if (url.pathname === '/api/decidir' && req.method === 'POST') return rotaDecidir(req, res);
    if (url.pathname === '/api/transcricao') return rotaTranscricao(req, res);
    if (url.pathname === '/api/reunioes' || url.pathname.startsWith('/api/reunioes/')) return rotaReunioes(req, res, url);
    responder(res, 404, { erro: 'não encontrado' });
  } catch (e) {
    responder(res, 500, { erro: e.message });
  }
});

// Só na própria máquina: a página não fica exposta na rede.
servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`Copiloto no ar: http://localhost:${PORTA}  (Ctrl+C para parar)`);
});
