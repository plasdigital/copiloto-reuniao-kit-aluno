# Copiloto de reunião: manual do agente

## O que esta pasta faz

Página local (http://localhost:3030) que ouve a reunião do Meet no Chrome, transcreve a voz do cliente (grátis
pelo Chrome, ou pela OpenAI se houver chave), manda cada frase final do cliente para o Jev (modelo de decisão na OpenRouter) e mostra o cartão da objeção que ele identificou.

## As possibilidades

**Pode rodar sem perguntar (só lê):**

| O dono pede | Você faz |
|---|---|
| "está configurado?" | confira `node --version` (≥ 18), se existe `.env.local` com `OPENROUTER_API_KEY=` preenchido (não mostre o valor) e se `objecoes.json` é JSON válido |
| "o servidor está no ar?" | `curl -s http://localhost:3030/api/objecoes` |
| "quais objeções ele reconhece?" | leia `objecoes.json` e liste `nome` + `quando` |
| "explica como funciona" | resuma `docs/como-funciona.md` |
| "como foi a reunião com X?" / "resume a última reunião" | leia o `.md` em `reunioes/` (o mais recente, ou o que tem o nome do cliente) e resuma: objeções, dores, próximos passos |
| "por que o cartão não apareceu na frase Y?" | ache a frase no `.md` da reunião; o `(quase: … NN%)` diz qual objeção a IA quase escolheu. Proponha um `quando` mais claro (`docs/seus-cartoes.md`) |

**Custa centavos, avise antes na primeira vez:**

| O dono pede | O comando |
|---|---|
| "testa com a frase X" | `node testar.mjs "X"` (servidor precisa estar no ar; ~US$ 0,00004 por frase) |

**Muda arquivo (mostre o que vai mudar e espere o sim):**

| O dono pede | Você faz |
|---|---|
| "configura pra mim" | copie `.env.exemplo` → `.env.local`; peça a chave da OpenRouter ao dono e grave você mesmo. Pergunte se ele quer a transcrição da OpenAI (opcional, ~US$ 1/hora); se sim, grave a `OPENAI_API_KEY` também |
| "quero outro provedor de transcrição" | siga "Quer outro provedor" em `docs/como-funciona.md`: uma função `ouvidoX()` no `index.html` e, se precisar de chave, uma rota no `servidor.mjs` |
| "o meu negócio é X" | reescreva `contexto` no `objecoes.json` |
| "troca os cartões pelas objeções do meu produto" | entreviste o dono (o que ele vende, as 5 a 8 objeções que mais ouve, como responde hoje) e reescreva `objecoes` seguindo `docs/seus-cartoes.md` |
| "cria um cartão para Y" | acrescente um objeto em `objecoes` com `id` novo (minúsculas e `_`), `nome`, `quando`, `empatia`, `pergunta`, `depois` |
| "está aparecendo cartão demais / de menos" | ajuste `CORTE` no `index.html` (padrão 0.6) e o mesmo valor no `testar.mjs` |
| "quero que ele perceba Z também" | acrescente uma pergunta em `perguntas()` no `servidor.mjs` (tipos e formato em `docs/como-funciona.md`) e trate a resposta em `decidir()` no `index.html` |

Não é lista fechada: o Jev aceita qualquer pergunta `choice`, `noul` ou `score`. Se o dono pedir algo
que não está aqui, leia `servidor.mjs` e `index.html` e proponha a mudança.

## O que precisa estar configurado

| Para | Precisa | Como checar (só lê) |
|---|---|---|
| tudo | Node 18+ | `node --version` |
| decidir objeção | `OPENROUTER_API_KEY` no `.env.local`, ao lado do `jev.mjs`, e crédito na OpenRouter | `node testar.mjs "achei caro"` responde sem erro |
| ouvir a reunião (grátis) | Google Chrome atualizado | a página abre sem o alerta "Abra no Google Chrome" |
| ouvir pela OpenAI (opcional) | `OPENAI_API_KEY` no mesmo `.env.local` e crédito na OpenAI | `curl -s http://localhost:3030/api/transcricao` responde `{"openai":true}` |

## As travas

- **Nunca** mostre, copie para outro arquivo nem mande para lugar nenhum o valor da `OPENROUTER_API_KEY` nem da `OPENAI_API_KEY`.
- **Nunca** coloque uma chave no `index.html` nem em nada que o navegador carregue. Quem chama a IA é o `servidor.mjs`; a página só recebe a senha temporária da OpenAI.
- **Nunca** troque `servidor.listen(PORTA, '127.0.0.1', …)` para escutar na rede (`0.0.0.0`): a página não tem senha.
- **Nunca** mande o conteúdo de `reunioes/` para fora do computador (e-mail, nuvem, outro serviço) sem o dono pedir. É a fala do cliente dele, palavra por palavra. A pasta está no `.gitignore`; não tire de lá.
- **Nunca** apague nem reescreva cartões sem mostrar o antes e o depois e ter o sim do dono.
- **Não** suba o `.env.local` para o git (está no `.gitignore`; não tire de lá).

## As armadilhas

| O erro diz | O que é de verdade |
|---|---|
| `Sem OPENROUTER_API_KEY no .env.local` | o `.env.local` não existe, está em outra pasta ou a linha está vazia |
| `Jev 401` | chave errada ou apagada na OpenRouter |
| `Jev 402` | acabou o crédito da OpenRouter |
| `não é um model ID válido` | alguém chamou o Jev por `/chat/completions`. Ele só atende `POST /api/alpha/decisions` (já é o que o `jev.mjs` faz) |
| `Jev 404` ou formato de resposta diferente | o endpoint do Jev é **alpha** e pode mudar. Confira a documentação da OpenRouter e ajuste `jev.mjs` |
| página: "Sem áudio" | na hora de escolher a aba, "Compartilhar áudio da guia" ficou desmarcado |
| canal Cliente: `erro (…)` logo ao começar | Chrome antigo: o `start(trilha)` (ouvir uma aba) é recurso novo. Atualize o Chrome |
| canal: `erro (network)` com o Chrome | caiu a internet, ou o serviço de voz do Google não respondeu. Já aconteceu de dar só em português, num perfil do Chrome, com o inglês funcionando. Teste em outro perfil do Chrome ou troque a **Transcrição** para OpenAI |
| opção "OpenAI · sem chave no .env.local" desligada | falta a `OPENAI_API_KEY` no `.env.local` (é opcional). Recarregue a página depois de colar |
| canal com a OpenAI: `erro (OpenAI 401)` ou `(... 429)` | chave errada, ou sem crédito na OpenAI |
| `EADDRINUSE` ao ligar | já tem um copiloto (ou outro programa) na porta 3030. Feche o outro ou rode com `PORTA=3031` |
| cartão certo não aparece | a certeza ficou abaixo de 0,6. Rode `node testar.mjs "<a frase>"` e melhore o `quando` do cartão |

## Onde está o porquê

- `docs/como-funciona.md`: o caminho da fala até o cartão, as 5 perguntas, a regra, custo e segurança.
- `docs/seus-cartoes.md`: como escrever `contexto`, `quando` e o texto do cartão.
