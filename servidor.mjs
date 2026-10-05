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
    responder(res, 200, { answers: r.answers, ms: r.ms, custo: r.usage?.cost ?? null });
  } catch (e) {
    console.error(new Date().toISOString(), e.message);
    responder(res, 502, { erro: e.message });
  }
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
    responder(res, 404, { erro: 'não encontrado' });
  } catch (e) {
    responder(res, 500, { erro: e.message });
  }
});

// Só na própria máquina: a página não fica exposta na rede.
servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`Copiloto no ar: http://localhost:${PORTA}  (Ctrl+C para parar)`);
});
