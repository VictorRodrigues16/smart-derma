# Smart Derma: MVP

A pessoa responde perguntas rápidas sobre a pele, autoriza o uso da foto e envia uma foto do rosto. Uma IA (Claude, da Anthropic) dá nota de 0 a 100 para oito características da pele, diz o tipo de pele e monta uma rotina de manhã e de noite **só com produtos que a farmácia parceira tem em estoque**, dentro do orçamento da pessoa. A loja tem um painel com métricas e o cadastro do catálogo.

Projeto da disciplina Business Intelligence e Startup Development (FIAP, 4ESPR).

## Como rodar

Pré-requisitos: Node 24, pnpm e Docker (OrbStack serve).

```bash
pnpm install
pnpm db:subir                 # Postgres no Docker, porta 5490
pnpm prisma migrate deploy    # cria as tabelas
pnpm db:seed                  # contas de demonstração + 28 produtos (só cria o que falta)
pnpm dev                      # http://localhost:4370
```

Na primeira vez, copie `.env.example` para `.env.local` e preencha `SESSAO_SEGREDO` (qualquer texto aleatório com 24+ caracteres) e `ANTHROPIC_API_KEY`. A chave fica só no servidor; o navegador nunca vê.

### Contas de demonstração

A tela de login tem dois atalhos (com `DEMO_ATALHOS=1`): **Entrar como cliente** e **Entrar como loja**. Para entrar pelo formulário:

| Perfil | E-mail | Senha |
|---|---|---|
| Cliente | `cliente@smartderma.app` | `SmartDerma#2026` |
| Loja (farmácia parceira e modo totem) | `loja@smartderma.app` | `SmartDerma#2026` |

A senha muda com `SENHA_DEMO=... pnpm db:seed`. Antes de publicar o site, desligue os atalhos (`DEMO_ATALHOS=0`) e troque a senha.

## Produção

| Peça | Onde |
|---|---|
| Site e API | Vercel, projeto `smart-derma` (time victors-projects-3fd347f1), deploy pela CLI |
| Banco | Railway, projeto `smart-derma`, serviço `Postgres`, acesso público pelo proxy TCP `iriguchi.proxy.rlwy.net:53909` |
| Fotos de produto | Vercel Blob, store `smart-derma-produtos` (público), conectado ao projeto |

- **Publicar:** `vercel deploy --prod --yes --scope victors-projects-3fd347f1`. O build roda `prisma migrate deploy` e o seed nos servidores da Vercel, porque algumas redes bloqueiam a porta do Railway.
- **Seed em produção:** só cria o que falta. Preço, estoque e foto que a loja editar ficam como ela deixou.
- **Variáveis de produção:** ficam na Vercel, marcadas como sensíveis. Os limites são 20 análises por hora por conta e 150 por dia no total.
- **Atalhos de demonstração:** ficam ligados (`DEMO_ATALHOS=1`) para a apresentação. Com eles, qualquer pessoa com o link entra como loja e edita o catálogo. Depois da banca, desligue na Vercel e publique de novo.
- **A foto do rosto nunca vai para o Blob:** ela só passa pela memória do servidor durante a análise.

## Telas

| Rota | Quem | O que faz |
|---|---|---|
| `/entrar` | todos | login, cadastro e atalhos de demonstração |
| `/app` | cliente e totem | histórico de análises |
| `/app/analise/nova` | cliente e totem | perguntas, consentimento, foto (câmera ou galeria) e análise |
| `/app/analise/[id]` | dono e loja | resultado: medidas, tipo de pele, rotina, avaliação |
| `/loja` | loja | painel: análises por dia, tipos de pele, produtos mais indicados, taxa de acerto, custo da IA |
| `/loja/produtos` | loja | catálogo: cadastrar, editar, estoque, ativar e desativar |

## Como a IA foi "treinada"

O modelo não é retreinado. Ele aprende a tarefa por instruções e exemplos (`lib/ia/prompt.ts`), e as regras que não podem falhar ficam no código (`lib/ia/rotina.ts`):

1. **Régua de 0 a 100** para cada característica (oleosidade, ressecamento, poros, acne, manchas, vermelhidão, linhas finas e olheiras), com o que olhar na foto e faixas fixas: mínimo, leve, moderado, alto e intenso.
2. **Exemplos de calibragem**: pele mista com cravos, pele seca e sensível, foto de tela (recusa) e acne inflamada (sugere dermatologista).
3. **Portão de qualidade da foto**: sem rosto, mais de um rosto, desfocada, escura, distante, filtro ou maquiagem, ou imagem que não é foto real. A foto recusada volta com orientação de como tirar outra.
4. **Limites**: orienta cosmético, não diagnostica, não comenta aparência; sinais fora do cosmético geram "procure um dermatologista".
5. **Catálogo da loja no contexto**: a IA só indica códigos que vieram na lista do pedido.
6. **Segurança em código, antes e depois da IA**:
   - Antes da chamada, o catálogo é filtrado por estoque, orçamento, gravidez, pele sensível e idade.
   - Depois da resposta, cai qualquer código fora da lista e o turno incompatível é corrigido.
   - Também cai categoria repetida no mesmo turno, e retinol não fica na mesma noite que esfoliante.
   - Se a IA esquecer a base (limpeza, hidratante e protetor), o código completa.
7. **Saída estruturada**: a resposta precisa bater com o esquema zod (`lib/ia/esquema.ts`); se não bater, a análise é marcada como erro, nunca exibida pela metade.
8. **Retorno de quem usou**: "A análise acertou?" fica gravado e vira a taxa de acerto no painel da loja. É o dado para melhorar o prompt.

Para conferir o treino depois de mexer no prompt:

```bash
pnpm ia:testar caminho/da/foto.jpg --perfil=mista     # perfis: mista, seca, gestante
pnpm ia:testar https://endereco/da/foto.jpg           # a Anthropic busca a URL
pnpm regras:testar                                    # 10 regras de segurança, sem chamar a IA
```

### Desempenho medido (26/10/2026)

| Teste | Resultado | Tempo | Custo |
|---|---|---|---|
| Imagem sem rosto (telas do Figma) | recusada: "sem rosto", com orientação | 10,7 s | US$ 0,056 |
| Rosto real CC0, perfil pele seca e sensível | linhas 90, manchas 62, ressecamento 58; rotina sem ácidos, protetor mineral | 22,4 s | US$ 0,062 |
| Mesma foto, perfil gestante | retinol e ácido tranexâmico fora; vitamina C e protetor com cor | 18,1 s | US$ 0,058 |

O texto de instruções e o catálogo ficam em cache na Anthropic: da segunda análise em diante, cerca de 9 mil tokens são lidos do cache a 5% do preço.

## Especificações técnicas (slide do CP3)

| Dimensão | Definição |
|---|---|
| Stack / tecnologias | Next.js 16 (App Router) e React 19 em TypeScript; Tailwind CSS 4; PostgreSQL 17 com Prisma 7; SDK oficial da Anthropic (`@anthropic-ai/sdk`) com o modelo Claude Opus 5.5; sharp para tratar a foto; jose e bcrypt para sessão e senha |
| Arquitetura | Aplicação web única (telas e API no mesmo projeto Next.js). O navegador reduz a foto; a API limpa a imagem, filtra o catálogo, chama o Claude com saída estruturada, confere a rotina em código e grava o resultado no Postgres |
| Integrações e APIs | API de Mensagens da Anthropic (visão + saída estruturada + cache de prompt + modelo alternativo automático em caso de recusa). API própria: `/api/auth/*`, `/api/analises`, `/api/analises/[id]/avaliacao`, `/api/produtos` |
| Dados coletados e onde ficam | Conta (nome, e-mail, senha com hash bcrypt), respostas do questionário, data do consentimento, resultado da análise (tipo de pele, notas, produtos indicados), avaliação e tokens consumidos. Tudo no Postgres. **A foto não é guardada**: vive só na memória da requisição e some depois da análise |
| Segurança / LGPD | Consentimento explícito antes da foto; foto descartada; metadados da imagem (EXIF, que pode ter localização) apagados; chave da IA só no servidor; sessão em cookie httpOnly assinado; freio de tentativas de login e de análises por hora e por dia; cada pessoa só vê as próprias análises |
| Limitações conhecidas | Análise por foto de celular, não por câmera microscópica; não é diagnóstico; depende de luz e foco; catálogo de demonstração com marcas fictícias; 15 a 25 segundos por análise; sem venda no app (a pessoa compra no balcão) |

## Estrutura

```
app/                 telas (Next.js App Router) e app/api (rotas)
components/          componentes da interface
lib/tipos.ts         tipos e rótulos compartilhados
lib/ia/              prompt (treino), esquema da resposta, regras de rotina, chamada ao Claude
lib/servidor/        sessão, guarda de acesso, freios, foto, gravação e leituras do banco
lib/cliente/         chamadas do navegador para a API e preparo da foto
prisma/              esquema do banco, migrações e seed
scripts/testar-ia.ts teste da IA de ponta a ponta
docs/CONTRATO.md     contrato entre telas e servidor
```
