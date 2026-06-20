# EnglishPath — Trilha de Inglês com IA

Webapp de aprendizado de inglês estruturado, com professor IA, avaliação de nível CEFR, trilha personalizada por objetivo e gamificação.

## Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Next.js API Routes (Node.js)
- **Banco:** MongoDB + Mongoose
- **Auth:** JWT em cookie httpOnly (jose)
- **IA:** OpenAI-compatible API (funciona com mock gratuito sem API key)

## Funcionalidades

- Cadastro e login seguro (bcrypt + JWT)
- Onboarding com objetivo, autoavaliação e quiz diagnóstico (8 questões + fala por áudio)
- Diagnóstico de nível CEFR real
- Dashboard com progresso, XP, streak e notificações
- Lição do dia personalizada por objetivo e nível
- Quiz direcionado com feedback
- Vocabulário e gramática estruturados
- Chat com professor IA (texto + voz via Web Speech API)
- Gamificação: XP, streaks, conquistas

## Pré-requisitos

- Node.js 20+
- MongoDB rodando localmente (ou MongoDB Atlas)

## Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com sua URI do MongoDB

# Iniciar MongoDB (se local)
# brew services start mongodb-community  # macOS

# Rodar em desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `MONGODB_URI` | URI de conexão MongoDB |
| `JWT_SECRET` | Chave secreta para tokens (use `openssl rand -base64 32`) |
| `AI_API_KEY` | (Opcional) Chave da API de IA |
| `AI_API_URL` | (Opcional) URL da API compatible com OpenAI |
| `AI_MODEL` | (Opcional) Modelo de IA (default: gpt-4o-mini) |

Sem `AI_API_KEY`, o chat usa respostas mock inteligentes gratuitamente.

## Estrutura do projeto

```
src/
├── app/
│   ├── (auth)/          # Login e registro
│   ├── (app)/           # App autenticado (dashboard, lições, quiz, chat)
│   ├── onboarding/      # Fluxo de triagem e avaliação
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Componentes reutilizáveis
│   └── layout/          # Shell do app
├── lib/
│   ├── auth/            # JWT e sessão
│   ├── db/              # Conexão MongoDB
│   ├── data/            # Conteúdo (questões, lições)
│   └── validations/     # Schemas Zod
├── models/              # Mongoose models
├── services/            # Lógica de negócio (IA)
└── types/               # TypeScript types
```

## Fluxo do usuário

1. **Cadastro** → `/register`
2. **Onboarding** → objetivo + nível autoavaliado + quiz (5-10 questões)
3. **Diagnóstico** → nível CEFR real
4. **Dashboard** → progresso, lição do dia, atalhos
5. **Estudo** → lições, quiz, vocabulário, chat com IA

## Segurança

- Senhas hasheadas com bcrypt (12 rounds)
- JWT em cookie httpOnly + secure em produção
- Validação de input com Zod em todas as APIs
- Middleware de autenticação
- Sem exposição de respostas corretas na API de questões

## Scripts

```bash
npm run dev      # Desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # ESLint
```
