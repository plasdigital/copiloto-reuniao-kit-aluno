# Copiloto de vendas ao vivo

Uma página no seu computador que escuta a reunião do Google Meet. Quando o cliente levanta uma objeção
("achei caro", "vou pensar", "preciso falar com meu sócio"), o cartão com a resposta aparece na hora:
a frase de empatia, a pergunta-chave e o que fazer depois. A página também marca a fase da reunião e
anota as dores que o cliente conta, para você usar na hora do preço.

## O que você precisa

- **Google Chrome** atualizado (a transcrição é um recurso dele).
- **Node.js 18 ou mais novo** ([nodejs.org](https://nodejs.org)).
- **Uma chave da OpenRouter** ([openrouter.ai/keys](https://openrouter.ai/keys)), com alguns dólares de
  crédito. Cada frase do cliente custa cerca de US$ 0,00004: mil frases dão uns 4 centavos de dólar.
- **Fone de ouvido** na reunião (sem fone, a voz do cliente vaza para o seu microfone).
- Opcional: o **Claude Code** ([claude.com/pricing](https://claude.com/pricing), é pago). Abra o Claude
  Code dentro desta pasta e peça o que quiser em português, por exemplo "configura pra mim" ou
  "troca os cartões pelas objeções do meu produto".

## Ordem de leitura

1. [COMECE-AQUI.md](COMECE-AQUI.md): a configuração, uma vez só.
2. [docs/como-funciona.md](docs/como-funciona.md): o caminho da fala até o cartão.
3. [docs/seus-cartoes.md](docs/seus-cartoes.md): como trocar os cartões pelos do seu negócio.

## O que tem na pasta

| Arquivo | O que é |
|---|---|
| `abrir.cmd` | Atalho do Windows: sobe o servidor e abre a página no Chrome |
| `index.html` | A página (abas Reunião e Minhas objeções) |
| `servidor.mjs` | O servidor local: entrega a página, guarda os cartões e chama a IA. Sem dependência |
| `jev.mjs` | O cliente do Jev, a IA que decide qual objeção é |
| `objecoes.json` | Os cartões e o que você vende. **É o arquivo que você vai trocar** |
| `testar.mjs` | Testa tudo sem reunião: `node testar.mjs "achei caro"` |
| `.env.exemplo` | Modelo do arquivo da chave |
