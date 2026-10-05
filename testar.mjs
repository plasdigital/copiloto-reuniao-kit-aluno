// Testa a corrente inteira sem reunião: manda uma fala de cliente para o servidor que está rodando
// e mostra o que o Jev decidiu e se o cartão apareceria. Custa uma decisão (~US$ 0,00004).
//
//   node testar.mjs "achei meio caro"
//
// Precisa do servidor no ar (node servidor.mjs, ou abrir.cmd) em outro terminal.
const PORTA = Number(process.env.PORTA || 3030);
const CORTE = 0.6; // o mesmo corte da página (index.html)
const frase = process.argv.slice(2).join(' ').trim() || 'achei meio caro, não sei se cabe no meu orçamento agora';

let r;
try {
  r = await fetch(`http://localhost:${PORTA}/api/decidir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frase, recente: [] }),
  });
} catch {
  console.error(`O servidor não está no ar em http://localhost:${PORTA}. Rode "node servidor.mjs" em outro terminal.`);
  process.exit(1);
}
const d = await r.json();
if (!r.ok) {
  console.error(`Erro do servidor (${r.status}): ${d.erro}`);
  process.exit(1);
}

const a = d.answers;
const pct = (x) => `${Math.round((x ?? 0) * 100)}%`;
const pObj = a.tem_objecao?.noul ?? 0;
const pDor = a.dor?.noul ?? 0;
const mostra = pObj >= CORTE && a.objecao?.choice !== 'nenhuma' && a.objecao?.confidence >= CORTE && pObj >= pDor;

console.log(`\nFala do cliente: "${frase}"\n`);
console.log(`  tem objeção?  ${pct(pObj)}`);
console.log(`  qual?         ${a.objecao?.choice} (${pct(a.objecao?.confidence)})`);
console.log(`  é dor?        ${pct(pDor)}`);
console.log(`  fase          ${a.fase?.choice} (${pct(a.fase?.confidence)})`);
console.log(`  terminou?     ${pct(a.terminou?.noul)}`);
console.log(`\n  → ${mostra ? `o cartão "${a.objecao.choice}" APARECE` : 'nenhum cartão (abaixo do corte de 60% ou é mais dor que objeção)'}`);
console.log(`  ${d.ms} ms · US$ ${d.custo ?? '?'}\n`);
