# Seus cartões: troque o exemplo pelo seu negócio

Os cartões que vêm no `objecoes.json` são de quem vende agentes de IA para empresas. Servem para
testar. Para usar de verdade, troque pelos do seu produto. Dá para editar o arquivo direto ou pela aba
**Minhas objeções** da página (botão **Salvar**).

## O arquivo

```json
{
  "contexto": "Reunião de vendas por vídeo. O vendedor oferece <o que você vende> para <quem>.",
  "objecoes": [
    {
      "id": "ta_caro",
      "nome": "Tá caro",
      "quando": "o cliente acha o preço alto, diz que está caro, pede para baixar o valor ou pede desconto",
      "empatia": "Eu te entendo. Entendo que você pode achar caro.",
      "pergunta": "Quando você diz que está caro, é porque acha que não vale, viu alguém mais barato ou não tem orçamento agora?",
      "depois": "Não vale → reapresente o valor. Concorrente → cartão do concorrente. Orçamento → compare com o custo do problema."
    }
  ]
}
```

| Campo | Quem lê | Como escrever |
|---|---|---|
| `contexto` | o Jev | uma frase: o que você vende e para quem |
| `id` | o código | minúsculas e `_`, sem espaço e sem acento; não repita |
| `nome` | você, no topo do cartão | curto, como você chama a objeção |
| `quando` | **o Jev, para decidir** | as formas como o **cliente** fala essa objeção |
| `empatia` | você, na tela | a primeira frase, para baixar a guarda |
| `pergunta` | você, em destaque | a pergunta que destrava; é o centro do cartão |
| `depois` | você, embaixo | o caminho para cada resposta possível |

## O campo que mais importa: `quando`

O Jev escolhe o cartão comparando a frase do cliente com o `quando` de cada um. Então:

- **Escreva como o cliente fala**, não como o vendedor pensa. "o cliente diz que vai pensar, quer
  analisar com calma, dá retorno depois" funciona melhor que "objeção de procrastinação".
- **Separe bem os parecidos.** "Tá caro" e "o concorrente faz mais barato" se confundem. Diga no
  `quando` o que distingue: o segundo **cita outra empresa ou proposta**.
- **Diga o que não é**, quando confundir. Exemplo real: "Demora pra implementar" estava pegando o
  cliente que reclamava da demora do **atendimento dele hoje** (que é dor, não objeção). Resolveu
  escrever: "o cliente acha longo o PRAZO QUE O VENDEDOR DEU (…) (não é a demora do atendimento dele hoje)".

Depois de mudar, teste a frase que deu errado:

```bash
node testar.mjs "a frase do cliente"
```

A saída mostra a certeza de cada pergunta. Se o cartão certo ficou abaixo de 60%, o `quando` ainda
não está claro o bastante.

## Quantos cartões

Entre 5 e 8. Com muitos cartões parecidos, a certeza de cada um cai e menos cartões passam do corte.
Comece pelas objeções que você mais ouve e acrescente quando aparecer uma nova.
