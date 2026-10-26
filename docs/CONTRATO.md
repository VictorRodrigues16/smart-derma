# Smart Derma: contrato entre telas e servidor

Este documento diz o que já existe no servidor e como as telas usam. Tudo é real: banco Postgres, sessão em cookie e IA (Claude) de verdade. Não existe mock em lugar nenhum.

## Divisão de arquivos

| Quem | Arquivos |
|---|---|
| **Servidor (não mexer nas telas)** | `lib/servidor/**`, `lib/ia/**`, `lib/prisma.ts`, `prisma/**`, `app/api/**`, `proxy.ts`, `package.json`, `next.config.ts`, `.env*` |
| **Compartilhado (pode importar, não mudar a forma)** | `lib/tipos.ts`, `lib/formatar.ts`, `lib/cliente/api.ts`, `lib/cliente/foto.ts` |
| **Telas** | `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/entrar/**`, `app/app/**` (exceto api), `app/loja/**`, `app/not-found.tsx`, `components/**`, `public/**` |

## Papéis

- **cliente**: faz análises e vê o próprio histórico. Área `/app`.
- **loja**: conta da farmácia parceira. Vê o painel (`/loja`), cadastra produtos (`/loja/produtos`) e também pode rodar análises pelo "modo totem" (`/app/analise/nova`), porque o totem fica logado na conta da loja.

## Funções de servidor para páginas (Server Components)

Toda página protegida chama a guarda primeiro. A guarda redireciona sozinha quando não pode.

```ts
import { exigirSessao, exigirCliente, exigirLoja } from '@/lib/servidor/guarda'
import { lerSessao } from '@/lib/servidor/sessao'          // null quando não há sessão (não redireciona)
import { destinoDoPapel } from '@/lib/servidor/sessao'      // 'cliente' → '/app', 'loja' → '/loja'
import {
  listarAnalisesDoUsuario, // (usuarioId, limite?) → AnaliseResumo[]
  obterAnalise,            // (id, sessao) → AnaliseCompleta | null (null = não existe ou não pode ver)
  listarProdutos,          // ({ incluirInativos? }) → ProdutoVitrine[]
  obterProduto,            // (id) → ProdutoVitrine | null
  metricasLoja,            // () → MetricasLoja
} from '@/lib/servidor/dados'
```

Os tipos (`AnaliseResumo`, `AnaliseCompleta`, `ProdutoVitrine`, `MetricasLoja`, `SessaoPublica`, `Medida`, `ItemRotina`) e todos os rótulos em português (`ROTULO_MEDIDA`, `ROTULO_NIVEL`, `ROTULO_TIPO_PELE`, `ROTULO_CATEGORIA`, `ROTULO_TURNO`, `ROTULO_CONFIANCA`, `OPCOES_*`) estão em `lib/tipos.ts`. Use os rótulos de lá; não escreva rótulo de novo na tela.

`process.env.DEMO_ATALHOS === '1'` liga os atalhos de demonstração na tela de login. Leia na página (servidor) e passe para o componente de cliente como prop.

## Funções de navegador (Client Components)

```ts
import { entrar, cadastrar, entrarDemo, sair, enviarAnalise, avaliarAnalise, criarProduto, atualizarProduto } from '@/lib/cliente/api'
import { prepararArquivo, capturarDaCamera, abrirCameraFrontal, fecharCamera } from '@/lib/cliente/foto'
```

Todas devolvem `{ ok: true, ... }` ou `{ ok: false, erro: string }`. A mensagem de `erro` já vem pronta para mostrar na tela.

- `entrar` / `cadastrar` / `entrarDemo` devolvem `{ ok: true, destino }`. Depois do ok: `router.replace(destino)` e `router.refresh()`.
- `sair()` e depois `router.replace('/entrar')` e `router.refresh()`.
- `enviarAnalise(foto, respostas, consentimento)` leva de 10 a 40 segundos. Devolve:
  - `{ ok: true, status: 'concluida', id }` → ir para `/app/analise/{id}`
  - `{ ok: true, status: 'foto_recusada', id, motivo, orientacao }` → voltar para o passo da foto mantendo as respostas, mostrar `motivo` e `orientacao`
  - `{ ok: false, erro }` → mostrar o erro com botão de tentar de novo
- A foto: `prepararArquivo(file)` para galeria, ou `abrirCameraFrontal()` + `<video>` + `capturarDaCamera(video)` para câmera ao vivo. Se `abrirCameraFrontal()` devolver `null` (sem câmera ou permissão negada), mostrar só "Enviar da galeria". Sempre `fecharCamera(stream)` ao sair do passo.
- `avaliarAnalise(id, 1 | -1, comentario?)`: "A análise acertou?" no resultado.
- `criarProduto(ProdutoEntrada)` / `atualizarProduto(id, Partial<ProdutoEntrada>)`: depois do ok, `router.refresh()`. O esquema de validação é `ProdutoEntradaSchema` (preço em centavos).
- `enviarImagemProduto(arquivo)`: reduz a imagem no navegador, sobe para o Vercel Blob e devolve `{ ok: true, url }`. A `url` vai em `imagemUrl` ao criar ou atualizar o produto; `imagemUrl: null` remove a foto. Produto sem foto aparece com a ilustração da categoria.

## Rotas da API (já implementadas)

| Método | Rota | Quem | Corpo |
|---|---|---|---|
| POST | `/api/auth/entrar` | todos | `{ email, senha }` |
| POST | `/api/auth/cadastrar` | todos | `{ nome, email, senha }` (senha com 8+ caracteres; cria conta de cliente) |
| POST | `/api/auth/demo` | todos, só com DEMO_ATALHOS=1 | `{ perfil: 'cliente' \| 'loja' }` |
| POST | `/api/auth/sair` | logado | `{}` |
| POST | `/api/analises` | logado | multipart: `foto` (jpeg), `respostas` (JSON de `Respostas`), `consentimento` (`sim`) |
| POST | `/api/analises/[id]/avaliacao` | dono da análise | `{ nota: 1 \| -1, comentario? }` |
| POST | `/api/conta/apagar` | cliente | `{ escopo: 'historico' \| 'conta' }` (LGPD; conta de demonstração não pode ser excluída) |
| POST | `/api/produtos` | loja | `ProdutoEntrada` |
| POST | `/api/produtos/imagem` | loja | multipart: `imagem` → `{ ok, url }` (Vercel Blob) |
| PATCH | `/api/produtos/[id]` | loja | `Partial<ProdutoEntrada>` |

## Rotas de tela

| Rota | Guarda | Dados |
|---|---|---|
| `/` | nenhuma | `lerSessao()`: com sessão vai para `destinoDoPapel`, sem sessão vai para `/entrar` |
| `/entrar` | nenhuma (com sessão, redireciona) | login, cadastro e atalhos de demonstração |
| `/app` | `exigirSessao()` | `listarAnalisesDoUsuario(sessao.id)` |
| `/app/analise/nova` | `exigirSessao()` | fluxo de 4 passos: perguntas, consentimento, foto, analisando |
| `/app/analise/[id]` | `exigirSessao()` | `obterAnalise(id, sessao)`; `notFound()` quando null |
| `/loja` | `exigirLoja()` | `metricasLoja()` |
| `/loja/produtos` | `exigirLoja()` | `listarProdutos({ incluirInativos: true })` |

## Regras de produto que a tela precisa respeitar

- A foto **não é guardada**. O texto do consentimento diz exatamente isso: a foto serve só para esta análise e é apagada assim que o resultado sai; o que fica salvo é o resultado (tipo de pele, notas e produtos indicados).
- A análise **não é diagnóstico**. Todo resultado mostra: "A Smart Derma orienta a escolha de cosméticos e não substitui a consulta com um dermatologista."
- Quando `sugerirDermatologista` for true, o aviso aparece em destaque, acima da rotina, com tom calmo.
- Produto de turno `ambos` aparece na rotina da manhã e na da noite.
