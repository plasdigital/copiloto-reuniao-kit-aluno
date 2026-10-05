# Comece aqui

Faça uma vez só, nesta ordem. Leva uns 10 minutos.

## 1. Baixe a pasta

```bash
git clone https://github.com/plasdigital/copiloto-reuniao-kit-aluno.git
cd copiloto-reuniao-kit-aluno
```

Sem git: no GitHub, botão **Code → Download ZIP**, e descompacte.

## 2. Confira o Node

```bash
node --version
```

Precisa sair `v18` ou mais. Se der "comando não encontrado", instale em [nodejs.org](https://nodejs.org).

## 3. Cole a sua chave da OpenRouter

1. Crie a chave em [openrouter.ai/keys](https://openrouter.ai/keys) e ponha alguns dólares de crédito
   em [openrouter.ai/credits](https://openrouter.ai/credits).
2. Copie o arquivo `.env.exemplo` com o nome `.env.local`, na mesma pasta.
3. Abra o `.env.local` e cole a chave depois do `=`:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

O `.env.local` nunca vai para o GitHub (está no `.gitignore`), e a chave nunca vai para o navegador:
quem a usa é o servidor, no seu computador.

## 4. Diga o que você vende

Abra o `objecoes.json` e troque o campo `contexto` por uma frase sobre o seu negócio. Exemplo:

```json
"contexto": "Reunião de vendas por vídeo. O vendedor oferece consultoria de tráfego pago para clínicas."
```

Os cartões que vêm prontos são de quem vende agentes de IA. Servem para testar; depois troque pelos
seus ([docs/seus-cartoes.md](docs/seus-cartoes.md)).

## 5. Ligue

- **Windows:** dois cliques no `abrir.cmd`. Ele sobe o servidor e abre a página no Chrome.
  Fechar a janela preta desliga o copiloto.
- **Mac ou Linux:** no terminal, `node servidor.mjs`, e abra http://localhost:3030 no Chrome.

## 6. Teste sem reunião

Com o servidor ligado, em outro terminal:

```bash
node testar.mjs "achei meio caro"
```

Tem que aparecer a decisão e `o cartão "ta_caro" APARECE`. Na página, o campo
**Simular fala do cliente** faz o mesmo: digite a fala e aperte Enter.

## 7. Use numa reunião

1. Ponha o fone de ouvido.
2. Entre no Meet em outra aba do Chrome.
3. Na página do copiloto, clique em **Começar a ouvir**.
4. Escolha a **aba do Meet** e deixe marcado **Compartilhar áudio da guia**.
5. Permita o microfone.
6. Deixe a janela do copiloto estreita, ao lado do Meet.

As duas bolinhas verdes no topo ("Você" e "Cliente") dizem que os dois ouvidos estão ligados. Quando o
cliente levantar uma objeção, o cartão aparece em menos de um segundo.

Deu erro? Veja as armadilhas no fim do [CLAUDE.md](CLAUDE.md), ou peça ao Claude Code: "deu esse erro, o que é?".
