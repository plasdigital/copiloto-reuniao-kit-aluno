# Como funciona: da fala do cliente ao cartão

```
Aba do Meet = CLIENTE ─► transcrição ─────────► frase final do CLIENTE ─► Jev decide ─► regra no código ─► cartão
                         Chrome (grátis)         + 8 falas anteriores      5 perguntas    certeza ≥ 0,6
                         ou OpenAI (~US$ 1/h)
```

## 1. O ouvido: duas opções, você escolhe no topo da página

Quando você clica em **Começar a ouvir**, o Chrome pede para escolher uma aba; o som dela (a voz do
cliente) vira uma faixa de áudio. Quem transforma essa faixa em texto é o **ouvido**, escolhido no campo
**Transcrição** do cabeçalho:

| Ouvido | Custo | Como funciona |
|---|---|---|
| **Chrome · grátis** | R$ 0 | a transcrição do próprio Chrome (`SpeechRecognition`, pt-BR), pelo `start(trilha)`. Recurso recente: o Chrome precisa estar atualizado. O áudio vai para o serviço de voz do Google |
| **OpenAI** | ~US$ 0,017/min (~US$ 1/hora) | `gpt-live-transcribe` por WebRTC. O servidor pede uma senha temporária à OpenAI (`POST /api/transcricao`) e a página manda o áudio direto para ela. A chave fica no servidor |

Trocar o ouvido **não muda o resto**: os dois entregam a frase final para o mesmo lugar (`fraseFinal()` no
`index.html`), e dali para o Jev. Só a frase **final** do cliente vai para a IA; as parciais (as que
ainda estão mudando, em cinza) só aparecem na conversa. A sua voz não é transcrita.

Diferenças que você vai notar:
- **Chrome:** encerra a escuta depois de um silêncio, e a página religa sozinha. Às vezes junta várias
  frases numa só.
- **OpenAI:** o modelo não decide sozinho quando a frase acabou. A página mede o volume e fecha a frase
  depois de 0,7 s de silêncio (`SILENCIO_MS` no `index.html`).

Quer outro provedor (Deepgram, AssemblyAI, Whisper no seu PC)? O lugar é o mesmo: uma função
`ouvidoX(quem, idCanal, trilha)` no `index.html` que chame `fraseFinal()`, e, se ele precisar de chave,
uma rota no `servidor.mjs` como a `/api/transcricao`. Peça ao Claude Code.

## 2. O Jev decide

O Jev (`typesafe/jev-1.13`, pela OpenRouter) é um modelo que **não escreve texto**: ele recebe um
estado e devolve uma escolha, com a certeza de cada opção. Cada frase final do cliente gera uma chamada
com:

- **o estado:** a frase, as 8 falas anteriores da conversa e o `contexto` (o que você vende);
- **5 perguntas:**

| Pergunta | Tipo | Resposta |
|---|---|---|
| Tem objeção? | `noul` (sim/não) | probabilidade de 0 a 1 |
| Qual objeção? | `choice` | o `id` de um cartão, ou `nenhuma`, com a certeza |
| É dor? | `noul` | probabilidade |
| Que fase? | `choice` | abertura, dor, apresentação, objeção ou fechamento |
| Terminou de falar? | `noul` | probabilidade |

As opções da pergunta "Qual objeção?" saem do campo `quando` de cada cartão. O texto que aparece na
tela não passa pela IA: o Jev só escolhe **qual** cartão mostrar.

Formato da chamada, se você quiser acrescentar uma pergunta em `perguntas()` no `servidor.mjs`:

```js
minha_pergunta: {
  type: 'choice',                       // 'choice' (com criteria) · 'noul' (sim/não) · 'score' (nota)
  instructions: 'O cliente citou prazo?',
  criteria: { sim: 'falou de data, prazo ou urgência', nao: 'não falou' },   // só no choice
}
// resposta: answers.minha_pergunta.choice + .confidence (choice) · answers.minha_pergunta.noul (noul)
```

⚠️ O endpoint do Jev (`POST https://openrouter.ai/api/alpha/decisions`) é **alpha**: pode mudar. Ele
não aparece na lista de modelos da OpenRouter e não atende `/chat/completions`.

## 3. A regra fica no código, não na IA

A IA dá a certeza; quem decide mostrar é a página (`decidir()` no `index.html`):

1. O cartão só aparece com certeza **≥ 0,6** em "tem objeção?" **e** em "qual objeção?".
2. Se a frase for mais dor do que objeção, ela não vira cartão. Com dor ≥ 0,7, ela vai para a lista
   **Dores que ele contou**, para você usar na hora do preço.
3. A mesma objeção de novo em menos de 30 segundos só faz o cartão piscar, sem duplicar.
4. A fase só muda com certeza ≥ 0,5.

Os números estão no topo do `<script>` do `index.html` (`CORTE`, `REPETE_MS`).

## 3b. Cada reunião fica salva

Na primeira fala, a página abre uma reunião nova e a salva a cada frase (e no **Parar**) na pasta
`reunioes/`, com o nome `AAAA-MM-DD-HHhMMmSS`:

- **`.md`**, para ler: com quem foi, duração, objeções que apareceram, dores, suas notas e a conversa
  inteira. Cada frase do cliente leva entre parênteses o cartão que apareceu, a dor anotada ou a
  objeção que a IA **quase** escolheu, abaixo do corte. É assim que você descobre qual `quando` ajustar.
- **`.json`**, para a página reabrir na aba **Reuniões salvas**.

**Nova reunião** salva a atual e limpa a tela. Se o servidor não responder, a tela não é limpa.

## 4. Custo, tempo e segurança

- **Custo:** cerca de US$ 0,00004 por frase do cliente no Jev (medido em 24/set/2026). A transcrição é de
  graça no Chrome, ou ~US$ 1 por hora na OpenAI.
- **Tempo:** cerca de 300 ms por decisão; a primeira chamada pode demorar mais.
- **As chaves** ficam no `.env.local` e só o `servidor.mjs` as lê. O navegador nunca as vê: para a OpenAI,
  a página recebe só uma senha temporária, que vale um minuto para abrir a conexão.
- **O servidor** escuta só em `127.0.0.1`: ninguém da sua rede abre a página.
- **A conversa** fica só no seu computador, na pasta `reunioes/` (fora do git). Nada vai para a nuvem além
  do que já foi dito acima: o áudio para a transcrição (Google ou OpenAI) e cada frase do cliente para o Jev.

## Ainda não testado

- Uma reunião longa de verdade no Meet com cada um dos ouvidos (os dois foram testados com uma fala
  gravada em português no lugar da aba).
- Outros aplicativos de reunião além do Meet: qualquer um que rode numa aba do Chrome deveria
  funcionar, porque o que a página ouve é o som da aba.
