# Como funciona: da fala do cliente ao cartão

```
Microfone = VOCÊ ──────┐
                       ├─► Chrome transcreve ─► frase final do CLIENTE ─► Jev decide ─► regra no código ─► cartão
Aba do Meet = CLIENTE ─┘   (Web Speech API)      + 8 falas anteriores      5 perguntas    certeza ≥ 0,6
```

## 1. Os dois ouvidos

A página abre duas escutas da transcrição do próprio Chrome (`SpeechRecognition`, em pt-BR):

- **Você:** o microfone, pelo `start()` normal.
- **Cliente:** o áudio da aba do Meet. Quando você clica em **Começar a ouvir**, o Chrome pede para
  escolher uma aba; o som dela vira uma faixa de áudio, que vai para o `start(trilha)`. Esse recurso
  é recente no Chrome, por isso ele precisa estar atualizado.

Só a frase **final** do cliente vai para a IA. A sua fala e as frases parciais (as que ainda estão
mudando, em cinza) só aparecem na conversa.

A transcrição não custa nada, mas não é feita no seu computador: o Chrome manda o áudio para o serviço
de voz do Google. Por isso precisa de internet.

O Chrome encerra a escuta depois de um silêncio. A página religa sozinha enquanto você estiver ouvindo.

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

## 4. Custo, tempo e segurança

- **Custo:** cerca de US$ 0,00004 por frase do cliente (medido em 24/set/2026). A transcrição é de graça.
- **Tempo:** cerca de 300 ms por decisão; a primeira chamada pode demorar mais.
- **A chave** fica no `.env.local` e só o `servidor.mjs` a lê. O navegador nunca a vê.
- **O servidor** escuta só em `127.0.0.1`: ninguém da sua rede abre a página.
- **A conversa** não é gravada em disco. "Baixar transcrição" salva um `.txt` só quando você clica.

## Ainda não testado

- Os dois canais ao mesmo tempo numa reunião longa de verdade (se o Chrome segura as duas escutas a
  reunião inteira).
- Outros aplicativos de reunião além do Meet: qualquer um que rode numa aba do Chrome deveria
  funcionar, porque o que a página ouve é o som da aba.
