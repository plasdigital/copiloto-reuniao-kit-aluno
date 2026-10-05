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

**Opcional: a chave da OpenAI.** A transcrição grátis do Chrome já funciona sem nada. Se ela der erro, ou
se você quiser outra opção, crie uma chave em [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
e cole na linha `OPENAI_API_KEY=` do mesmo `.env.local`. Custa uns US$ 0,017 por minuto (~US$ 1 por hora
de reunião). Sem ela, a opção OpenAI aparece desligada na página.

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

1. Entre no Meet em outra aba do Chrome.
2. Na página do copiloto, escolha a **Transcrição** no topo: **Chrome · grátis** ou **OpenAI** (se você
   colou a chave). A escolha fica lembrada.
3. Clique em **Começar a ouvir**.
4. Escolha a **aba do Meet** e deixe marcado **Compartilhar áudio da guia**.
5. Deixe a janela do copiloto estreita, ao lado do Meet.
6. Escreva no campo do topo **com quem é a reunião** (o nome do cliente).

A bolinha verde em "Cliente" diz que o ouvido está ligado. Só a voz do cliente é transcrita (o som da aba
do Meet); a sua não entra. Quando o cliente levantar uma objeção, o cartão aparece um ou dois segundos
depois que ele termina a frase.

A reunião se salva sozinha a cada frase, na pasta `reunioes/`. Acabou? Clique em **Parar** e depois em
**Nova reunião**, que limpa a tela para a próxima. As antigas ficam na aba **Reuniões salvas**.

Deu erro? Veja as armadilhas no fim do [CLAUDE.md](CLAUDE.md), ou peça ao Claude Code: "deu esse erro, o que é?".
