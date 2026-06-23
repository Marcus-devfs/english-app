# Norte — Features de Aprendizado (v0.2)

Documentação das funcionalidades implementadas para melhorar a experiência de aprendizado, retenção e progresso real dos usuários.

> **Contexto:** Implementado após feedback de testadores e roadmap em `ROADMAP_EXPANSAO.md`.  
> **Decisão de produto:** Sem monetização nem limites free/Pro nesta fase — foco em crescimento de base e validação do app com **Gemini free** (`GEMINI_API_KEY`).

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Dashboard com métricas reais](#2-dashboard-com-métricas-reais)
3. [Pronúncia com Gemini](#3-pronúncia-com-gemini)
4. [Lições diárias geradas por IA](#4-lições-diárias-geradas-por-ia)
5. [Trilha alinhada ao conteúdo](#5-trilha-alinhada-ao-conteúdo)
6. [Quiz diário com IA](#6-quiz-diário-com-ia)
7. [Repetição espaçada (SRS)](#7-repetição-espaçada-srs)
8. [Role-play no chat](#8-role-play-no-chat)
9. [Reavaliação CEFR periódica](#9-reavaliação-cefr-periódica)
10. [Metas semanais reais](#10-metas-semanais-reais)
11. [Relatório semanal in-app](#11-relatório-semanal-in-app)
12. [Push comeback (usuário inativo)](#12-push-comeback-usuário-inativo)
13. [LGPD — exclusão completa de conta](#13-lgpd--exclusão-completa-de-conta)
14. [Segurança — anti-farm de XP](#14-segurança--anti-farm-de-xp)
15. [Correções de gravação de voz](#15-correções-de-gravação-de-voz)
16. [Arquitetura e arquivos](#16-arquitetura-e-arquivos)
17. [Variáveis de ambiente](#17-variáveis-de-ambiente)
18. [O que ficou de fora](#18-o-que-ficou-de-fora)

---

## 1. Visão geral

### Objetivo

Transformar o Norte de um MVP com métricas decorativas e conteúdo estático em um app que:

- **Mede progresso de verdade** (não só XP)
- **Gera conteúdo personalizado** por objetivo e nível via Gemini
- **Fixa vocabulário** com repetição espaçada
- **Pratica conversação** com role-play contextualizado
- **Reengaja** usuários inativos via push

### Stack envolvida

| Camada | Tecnologia |
|--------|------------|
| IA | Gemini 2.5 Flash (`GEMINI_API_KEY`) |
| Backend | Next.js API Routes |
| Banco | MongoDB + Mongoose |
| Voz (client) | Web Speech API |
| Push | web-push + cron externo |

### Novas rotas no app

| Rota | Descrição |
|------|-----------|
| `/review` | Flashcards de revisão espaçada |
| `/relatorio` | Relatório semanal de progresso |
| `/reassess` | Reavaliação de nível CEFR |

### Novos endpoints API

| Método | Endpoint | Função |
|--------|----------|--------|
| `GET` | `/api/stats/dashboard` | Métricas reais para o dashboard |
| `POST` | `/api/speech/evaluate` | Avaliação de pronúncia com Gemini |
| `GET` | `/api/quiz` | Quiz diário gerado/cacheado |
| `POST` | `/api/quiz/submit` | Submit com anti-farm de XP |
| `GET` | `/api/review` | Cards de vocabulário para revisar |
| `POST` | `/api/review` | Registrar resultado da revisão (SM-2) |
| `GET` | `/api/report/weekly` | Dados do relatório semanal |
| `GET` | `/api/assessment/reassess` | Verificar se reavaliação está disponível |
| `POST` | `/api/assessment/reassess` | Submeter reavaliação |

---

## 2. Dashboard com métricas reais

### Problema anterior

O dashboard exibia dados fictícios:

- `+8%` de progresso de nível (hardcoded)
- Barra de progresso em 68% fixo
- Precisão de quiz estimada (`70 + quizzesCompleted * 3`)
- XP da semana = XP total limitado a 500
- Meta semanal baseada em streak, não em dias reais

### Solução

Endpoint `GET /api/stats/dashboard` agrega dados reais de:

- `LessonCompletion` — lições completadas na semana
- `ChatMessage` — mensagens do usuário no chat
- `User.cachedQuiz.lastScore` — última precisão do quiz
- `User.progress` — streak, lições totais, nível
- `User.preferences` — metas de dias e minutos por semana

### Métricas exibidas

| Card | Fonte |
|------|-------|
| Nível atual + % da trilha | `lessonsCompleted / 5` (módulo da trilha) |
| XP esta semana | Soma de XP de lições + chat na semana |
| Lições | Total + quantas nesta semana |
| Precisão quiz | `cachedQuiz.lastScore` ou `—` se nunca fez |
| Meta semanal | Dias e minutos reais vs meta do perfil |

### Arquivos

- `src/app/api/stats/dashboard/route.ts`
- `src/lib/stats/weekly.ts`
- `src/app/(app)/dashboard/page.tsx`
- `src/components/engagement/engagement-cards.tsx` (`WeeklyGoalCard` atualizado)

---

## 3. Pronúncia com Gemini

### Problema anterior

A etapa de fala nas lições usava comparação local de palavras (Levenshtein/token match). Feedback fraco, especialmente em mobile — testadores reportaram botões travados e avaliação imprecisa.

### Solução

`POST /api/speech/evaluate` envia a transcrição e a frase-alvo para o Gemini, que retorna:

```json
{
  "passed": true,
  "score": 85,
  "missing": ["Fale «software» com mais clareza"],
  "message": "Feedback em português, encorajador"
}
```

**Fallback:** Se `GEMINI_API_KEY` não estiver configurada ou a API falhar, usa `evaluateSpeech()` local em `build-steps.ts`.

**Integração SRS:** Palavras não reconhecidas viram cards em `VocabCard` automaticamente.

### Fluxo na lição

1. Usuário grava a frase (Web Speech API)
2. Clica em "Verificar pronúncia"
3. Client chama `/api/speech/evaluate`
4. Feedback exibido via `LessonStepFeedback`
5. Se `passed: true` → etapa concluída

### Arquivos

- `src/services/speech.service.ts`
- `src/app/api/speech/evaluate/route.ts`
- `src/app/(app)/lessons/page.tsx` (handler `handleSpeakSubmit` async)

---

## 4. Lições diárias geradas por IA

### Problema anterior

~36 lições estáticas em `lessons.ts`, repetitivas e desalinhadas com os títulos da trilha.

### Solução

`src/services/lesson.service.ts` gera lições via Gemini com base em:

- **Objetivo** do usuário (`tech_career`, `travel`, etc.)
- **Nível CEFR** (`A1`–`C2`)
- **Título da lição na trilha** (ex.: "Daily stand-up", "No aeroporto")
- **Índice na trilha** (progressão de dificuldade)

### Cache

Lições são cacheadas no usuário para evitar regerar a cada request:

```typescript
User.cachedLesson = {
  lessonId: "2026-06-23-t0",  // data + índice da trilha
  trailIndex: 0,
  lesson: DailyLesson,
  source: "ai" | "static"
}
```

Nova lição é gerada quando:

- Muda o dia (fuso do usuário)
- Muda o índice da trilha

### Fallback

Se Gemini não estiver disponível, usa `getDailyLessonForTrail()` com conteúdo estático.

### Arquivos

- `src/services/lesson.service.ts`
- `src/app/api/lessons/route.ts`
- `src/models/User.ts` (`cachedLesson`)

---

## 5. Trilha alinhada ao conteúdo

### Problema anterior

Títulos em `trail.ts` ("Leading a standup", "No aeroporto") não correspondiam ao conteúdo da lição, que vinha de `DAILY_LESSONS` por nível CEFR apenas.

### Solução

1. API de lições passa o **título da trilha** para o gerador de IA
2. `getDailyLessonForTrail()` aceita `trailTitle` e sobrescreve o título estático
3. Resposta da API sempre usa `trailLesson.title` como título exibido

### Arquivos

- `src/lib/data/trail.ts` — metadados da trilha (títulos, duração, XP)
- `src/lib/data/lessons.ts` — `getDailyLessonForTrail(goal, level, trailIndex, trailTitle?)`

---

## 6. Quiz diário com IA

> Implementado na sprint anterior; documentado aqui por integração com o ecossistema.

### Comportamento

- `GET /api/quiz` — gera ou retorna quiz do dia (5 perguntas)
- Perguntas personalizadas por **objetivo + nível** via Gemini
- Respostas corretas **não expostas** no client
- **1 XP por dia** — `cachedQuiz.xpAwarded` impede farm
- Erros no quiz → cards SRS automaticamente

### Arquivos

- `src/services/quiz.service.ts`
- `src/app/api/quiz/route.ts`
- `src/app/api/quiz/submit/route.ts`
- `src/app/(app)/quiz/page.tsx`

---

## 7. Repetição espaçada (SRS)

### Conceito

Sistema de flashcards com algoritmo **SM-2** (mesmo do Anki) para fixar vocabulário no momento certo.

### Quando cards são criados

| Origem | Trigger |
|--------|---------|
| Quiz | Resposta errada no submit |
| Chat | Correções retornadas pela IA |
| Pronúncia | Palavras não reconhecidas na avaliação de fala |
| Lição | (extensível — via `upsertVocabCards`) |

### Model `VocabCard`

```typescript
{
  userId, word, meaning, example?,
  goal, source: "lesson" | "quiz" | "chat" | "speech",
  ease: 2.5,        // fator de facilidade
  interval: 0,      // dias até próxima revisão
  repetitions: 0,
  nextReview: Date
}
```

Índice único: `userId + word` (sem duplicatas).

### API

**`GET /api/review`** — retorna até 10 cards com `nextReview <= hoje`

**`POST /api/review`** — body:
```json
{ "cardId": "...", "correct": true, "hard": false }
```
Atualiza intervalo via SM-2.

### UI — `/review`

1. Exibe palavra em inglês
2. Usuário toca "Mostrar resposta"
3. Escolhe "Lembrei!" ou "Preciso revisar"
4. Próximo card ou tela de conclusão

### Arquivos

- `src/models/VocabCard.ts`
- `src/lib/srs/sm2.ts`
- `src/lib/srs/vocab-cards.ts`
- `src/app/api/review/route.ts`
- `src/app/(app)/review/page.tsx`

---

## 8. Role-play no chat

### Conceito

Cenários de conversação contextualizados por objetivo — a IA assume um personagem e conduz o diálogo.

### Cenários disponíveis

| ID | Objetivo | Cenário |
|----|----------|---------|
| `standup` | tech_career | Daily stand-up remoto |
| `airport` | travel | Check-in no aeroporto |
| `meeting` | business | Reunião de projeto |
| `interview-intro` | career_abroad | "Tell me about yourself" |
| `coffee-chat` | conversation | Small talk no café |
| `presentation` | academic | Apresentação acadêmica |

### Fluxo

1. Usuário abre `/chat`
2. Vê chips de cenários no topo (filtrados pelo goal)
3. Toca em um cenário → chat reinicia com prompt de role-play
4. IA responde no personagem (Scrum Master, recepcionista, etc.)
5. Correções de gramática continuam funcionando

### Implementação técnica

- `chatMessageSchema` aceita `scenarioId` opcional
- `getAIResponse()` recebe `systemOverride` com prompt do cenário
- `buildRolePlayPrompt(scenario)` em `scenarios.ts`

### Arquivos

- `src/lib/data/scenarios.ts`
- `src/app/api/chat/route.ts`
- `src/app/(app)/chat/page.tsx`
- `src/services/ai.service.ts` (`systemOverride` no `AIContext`)

---

## 9. Reavaliação CEFR periódica

### Trigger

Disponível quando `lessonsCompleted > 0` e `lessonsCompleted % 20 === 0`.

Ex.: após completar a 20ª, 40ª, 60ª lição...

### Fluxo

1. Banner no dashboard: "Hora de medir seu progresso!"
2. Usuário acessa `/reassess`
3. `GET /api/assessment/reassess` gera 5 perguntas via Gemini
   - Foco nas **weaknesses** da última avaliação
   - Tipos: `multiple_choice`, `fill_blank`
4. Perguntas cacheadas em `User.cachedReassess` (sem expor respostas)
5. Submit avalia, atualiza `diagnosedLevel`, salva novo `Assessment`
6. Cache limpo após submit

### Arquivos

- `src/services/reassess.service.ts`
- `src/app/api/assessment/reassess/route.ts`
- `src/app/(app)/reassess/page.tsx`
- `src/models/User.ts` (`cachedReassess`)

---

## 10. Metas semanais reais

### Problema anterior

`WeeklyGoalCard` usava `streakDays` como proxy de dias praticados — impreciso.

### Solução

`getWeeklyStats()` calcula:

- **Dias praticados:** datas únicas com `LessonCompletion` ou `ChatMessage` na semana
- **Minutos:** estimativa `lições × 5 min + mensagens × 2 min`
- **Meta:** `preferences.practiceDaysPerWeek` e `practiceMinutesPerDay`

### UI

```
Meta semanal          3/5 dias
[S T Q Q S S D]       ← dias marcados conforme atividade real
Minutos de estudo     45/75 min
```

### Arquivos

- `src/lib/stats/weekly.ts`
- `src/components/engagement/engagement-cards.tsx`

---

## 11. Relatório semanal in-app

### Rota

`/relatorio` — acessível pelo card no dashboard.

### Dados (`GET /api/report/weekly`)

- XP, dias, minutos, lições e mensagens da semana
- Streak atual e XP total
- **Destaques** gerados automaticamente (ex.: "Completou 3 lições esta semana")
- **Foco para próxima semana** — weaknesses do último assessment
- Lições recentes com score
- Palavras revisadas no SRS

### Sem email/PDF

Nesta fase o relatório é **somente in-app** — sem dependência de serviços pagos (Resend, etc.).

### Arquivos

- `src/app/api/report/weekly/route.ts`
- `src/app/(app)/relatorio/page.tsx`

---

## 12. Push comeback (usuário inativo)

### Problema

Usuários que paravam de usar o app não recebiam mensagem específica de reengajamento.

### Solução

No scheduler (`evaluateReminderSchedule`):

- Se `daysSinceLastStudy(lastStudyDate) >= 3` → tipo de notificação = `comeback`
- Mensagens personalizadas por goal em `messages.ts`
- Ex.: *"Oi Marcus! Faz alguns dias que você não pratica. 15 min hoje já fazem diferença."*

### Novo tipo

```typescript
PushNotificationType = "daily_invite" | "gentle_nudge" | "streak_risk" | "comeback"
```

Respeita os mesmos slots (7h, 13h, 17h, 20h, 22h), quiet hours e cooldown.

### Arquivos

- `src/lib/push/scheduler.ts`
- `src/lib/push/messages.ts`
- `src/lib/push/types.ts`
- `src/lib/stats/weekly.ts` (`daysSinceLastStudy`)

---

## 13. LGPD — exclusão completa de conta

### Problema anterior

`DELETE /api/account` não removia `InterviewSession` nem `LessonCompletion` — dados órfãos.

### Solução

Exclusão em cascata de todas as collections do usuário:

```typescript
await Promise.all([
  ChatMessage.deleteMany({ userId }),
  Assessment.deleteMany({ userId }),
  NotificationLog.deleteMany({ userId }),
  InterviewSession.deleteMany({ userId }),
  LessonCompletion.deleteMany({ userId }),
  VocabCard.deleteMany({ userId }),
  User.findByIdAndDelete(userId),
]);
```

### Arquivo

- `src/app/api/account/route.ts`

---

## 14. Segurança — anti-farm de XP

### Correção

Removido caminho legado em `POST /api/progress` que concedia +20 XP sem `lessonId` válido — vetor de farm.

### Regras atuais de XP

| Ação | XP | Controle |
|------|-----|----------|
| Lição (1ª vez) | +20 | `LessonCompletion` unique por `lessonId` |
| Lição (revisão) | 0 | `isReview: true` |
| Chat | +5/msg | Rate limit 50/dia |
| Quiz | 0–100 | 1× por dia (`cachedQuiz.xpAwarded`) |
| Study session | +5 | Rate limit 10/hora |

### Arquivos

- `src/app/api/progress/route.ts`
- `src/app/api/quiz/submit/route.ts`

---

## 15. Correções de gravação de voz

> Implementado na sprint anterior; relevante para pronúncia funcionar.

### Problemas corrigidos

| Problema | Causa | Correção |
|----------|-------|----------|
| Botão "Ver meu diagnóstico" travado | Só habilitava após `stop()`, não durante gravação | `onTranscriptChange` atualiza resposta ao vivo |
| "Verificar pronúncia" não funcionava | Bug de closure no `stop()` — texto perdido | `interimRef` em vez de state stale |
| UI congelada | Re-render a cada palavra do `onresult` | Throttle via `requestAnimationFrame` |
| Sem feedback de erro de mic | `start()` falhava silenciosamente | `micError` exibido na UI |

### Arquivos

- `src/lib/hooks/use-voice-recorder.ts`
- `src/components/ui/voice-recorder.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/(app)/lessons/page.tsx`

---

## 16. Arquitetura e arquivos

### Diagrama de fluxo — loop de aprendizado

```
Onboarding (CEFR)
      ↓
Dashboard ←── Relatório semanal (/relatorio)
      ↓
Lição do dia ──→ Pronúncia (Gemini) ──→ SRS (/review)
      ↓                    ↓
Quiz diário (Gemini)    Chat + Role-play
      ↓                    ↓
Reavaliação (20 lições) ←── VocabCards
      ↓
Push comeback (3+ dias inativo)
```

### Novos models MongoDB

| Collection | Model | Descrição |
|------------|-------|-----------|
| `voccards` | `VocabCard` | Flashcards SRS |
| (campos no User) | `cachedLesson` | Lição do dia cacheada |
| (campos no User) | `cachedQuiz` | Quiz do dia + `lastScore` |
| (campos no User) | `cachedReassess` | Perguntas de reavaliação |

### Serviços de IA

| Serviço | Arquivo | Função |
|---------|---------|--------|
| Chat | `ai.service.ts` | Conversa + correções |
| Quiz | `quiz.service.ts` | 5 perguntas MC |
| Lição | `lesson.service.ts` | Lição diária completa |
| Pronúncia | `speech.service.ts` | Avaliação de fala |
| Reavaliação | `reassess.service.ts` | Perguntas de reassessment |
| Entrevista | `interview.service.ts` | (já existia) |

Todos usam o mesmo padrão:

1. Prompt estruturado com goal + level
2. Chamada Gemini com `responseMimeType: "application/json"`
3. Parse + validação Zod implícita
4. **Fallback estático** se API indisponível

---

## 17. Variáveis de ambiente

```bash
# Obrigatório para IA generativa (lições, quiz, pronúncia, reassess, chat)
GEMINI_API_KEY=AIza...

# Opcional — modelo (default: gemini-2.5-flash)
AI_MODEL=gemini-2.5-flash

# Opcional — forçar provider
AI_PROVIDER=gemini

# Banco e auth (já existentes)
MONGODB_URI=...
JWT_SECRET=...
```

Sem `GEMINI_API_KEY`, o app funciona em **modo estático/mock** — conteúdo de `lessons.ts` e algoritmos locais.

---

## 18. O que ficou de fora

Deliberadamente **não implementado** nesta fase (decisão de produto):

| Item | Motivo |
|------|--------|
| Limites free vs Pro | Foco em aquisição — usuários devem experimentar tudo |
| Stripe / PIX / cobrança | Monetização vem depois da validação |
| Paywalls e trials | Idem |
| Relatório por email/PDF | Evitar custo de Resend/SendGrid |
| Azure Speech / Whisper | Gemini free suficiente por ora |
| Shadowing / micro-lições | Próxima fase do roadmap |
| Analytics (PostHog/Sentry) | Próxima fase |

Ver `docs/ROADMAP_EXPANSAO.md` para próximos passos quando houver base de usuários consolidada.

---

## Referências internas

| Documento | Conteúdo |
|-----------|----------|
| `docs/ROADMAP_EXPANSAO.md` | Visão de longo prazo e backlog futuro |
| `docs/MONETIZACAO_E_COMUNICACAO.md` | Estratégia de receita (futura) |
| `docs/PUSH_NOTIFICATIONS.md` | Sistema de push e slots |
| `docs/SEGURANCA.md` | Hardening de APIs |

---

*Última atualização: junho 2026*
