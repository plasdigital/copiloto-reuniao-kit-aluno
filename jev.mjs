// Cliente do Jev (TypeSafe AI) pelo OpenRouter. Um arquivo, sem dependência.
//
// O Jev NÃO é modelo de texto: não aparece em GET /api/v1/models e não atende /chat/completions.
// Ele tem endpoint próprio — POST /api/alpha/decisions (alpha, 23/set/2026) — e devolve DECISÃO tipada.
//
// Formato conferido na marra contra a API em 23/set/2026 (a doc de terceiro estava desatualizada):
//   pedido:    { model, state: {…}, questions: { <chave>: { type, instructions, criteria? } } }
//   type:      'choice' (categorias, com criteria) · 'noul' (sim/não) · 'score' (nota)
//   resposta:  answers.<chave>.choice + .probabilities + .confidence   (choice)
//              answers.<chave>.noul  → probabilidade de 0 a 1          (noul)  ← NÃO é booleano
//              usage.cost em dólar, output_tokens cobrado a zero
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const MODELO = 'typesafe/jev-1.13';
const URL_DECISOES = 'https://openrouter.ai/api/alpha/decisions';

export function chave() {
  const arquivo = path.join(AQUI, '.env.local');
  const m = fs.existsSync(arquivo) && fs.readFileSync(arquivo, 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) {
    throw new Error('Sem OPENROUTER_API_KEY no .env.local (copie o .env.exemplo e cole a sua chave)');
  }
  return m[1].trim();
}

/** Uma decisão. Devolve { answers, usage, ms } — ms medido aqui. */
export async function decidir({ state, questions, modelo = MODELO, token = chave() }) {
  const t0 = Date.now();
  const r = await fetch(URL_DECISOES, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelo, state, questions }),
  });
  const ms = Date.now() - t0;
  const corpo = await r.json();
  if (!r.ok) throw new Error(`Jev ${r.status}: ${JSON.stringify(corpo).slice(0, 300)}`);
  return { ...corpo, ms };
}
