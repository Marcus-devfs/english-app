# Norte — Roadmap de Expansão

Documento estratégico e técnico para ir além do MVP, diferenciar o produto no mercado e **de fato** ajudar usuários brasileiros a falar inglês com propósito.

> Complementa: `MONETIZACAO_E_COMUNICACAO.md`, `PUSH_NOTIFICATIONS.md`, `SEGURANCA.md`

---

## 1. Onde o Norte está hoje

### Stack atual

| Camada | Tecnologia | Uso no app |
|--------|------------|------------|
| Frontend | Next.js 16, React 19, Tailwind 4 | App Router, PWA, UI mobile-first |
| Backend | API Routes (Next.js) | Auth, progresso, IA, pagamentos |
| Banco | MongoDB + Mongoose | Usuários, chat, lições, quiz, push |
| Auth | JWT (jose) + bcrypt | Sessão httpOnly, middleware |
| IA | Gemini / OpenAI (fallback mock) | Chat, quiz diário, entrevista |
| Voz (client) | Web Speech API | STT na gravação, TTS na lição |
| Pagamentos | Stripe (modo mock por padrão) | Plano Pro |
| PWA | Serwist 9 | Offline, install, service worker |
| Push | web-push + VAPID + cron externo | Lembretes personalizados por goal |
| Validação | Zod 4 | Todas as APIs |
| Rate limit | MongoDB TTL | Anti-abuse |

### O que já funciona de ponta a ponta

- Onboarding com diagnóstico CEFR (8 questões + speaking)
- Trilha por objetivo (6 goals)
- Lições multi-step (ouvir, traduzir, palavras, falar)
- Quiz diário com IA (Gemini) + anti-farm de XP
- Chat com professor IA (texto + voz)
- Simulador de entrevista (Pro)
- Streak, XP, push em slots fixos
- Admin básico, PWA instalável, LGPD

### O que ainda é superficial ou mock

| Área | Situação atual | Impacto no aprendizado |
|------|----------------|-------------------------|
| Conteúdo de lições | ~36 lições estáticas em `lessons.ts` | Repetição, pouca profundidade |
| Pronúncia | Match de palavras (Levenshtein), não IA | Feedback fraco vs apps de speech |
| Dashboard | Métricas decorativas (+8%, precisão estimada) | Usuário não vê progresso real |
| Pro | Só entrevista bloqueada; limites free não aplicados | Monetização fraca |
| Repetição espaçada | Não existe | Vocabulário não fixa na memória |
| Speaking assessment | Sem score CEFR de fala | Não mede o que mais importa |
| Relatórios | Não existe | Sem prova de evolução |

---

## 2. Visão: o que torna o Norte diferente

### O que os concorrentes fazem bem (e o Norte não precisa copiar)

| Concorrente | Força | Por que não competir aqui |
|-------------|-------|---------------------------|
| Duolingo | Gamificação, streak, escala | Jogo genérico, sem objetivo profissional |
| Babbel | Gramática estruturada | Curso fechado, pouca conversação livre |
| ELSA / Speechling | Pronúncia com IA | Foco narrow, sem trilha de carreira |
| Cambly / Preply | Humanos nativos | Caro, agenda, não escala para BR |

### Posicionamento único do Norte

```
Objetivo claro → Diagnóstico → Trilha personalizada → Prática real (IA + voz)
     ↓                                                              ↓
  Tech / viagem / negócios                              Feedback + progresso mensurável
```

**Frase norte:** *"Inglês com direção — para quem sabe por que está aprendendo."*

### Os 5 pilares de diferenciação

1. **Goal-first** — Todo conteúdo, push, quiz e IA respeitam o objetivo do usuário
2. **Conversação real** — Não só exercícios; diálogo com contexto profissional
3. **Feedback acionável** — Correções em português, com exemplos do mundo real do usuário
4. **Progresso honesto** — Métricas reais de skill, não só XP decorativo
5. **Brasil-native** — PWA, preço em BRL, horários locais, dores locais (entrevista gringa, stand-up remoto)

---

## 3. Pilares de expansão (com TODOs e tecnologias)

---

### Pilar A — Inteligência de aprendizado (o coração do produto)

**Por que:** Sem isso, o Norte vira mais um app de exercícios. Com isso, vira um tutor que *lembra* do usuário.

#### A1. Perfil de skills dinâmico

Substituir scores estáticos por tracking real por skill area.

| Item | Detalhe |
|------|---------|
| **O quê** | Grammar, vocabulary, speaking, reading, listening — cada um com histórico e tendência |
| **Como** | Agregar de `LessonCompletion`, quiz, chat corrections, interview feedback |
| **Tech** | MongoDB aggregation, novo schema `SkillSnapshot` (semanal) |
| **UI** | Radar chart no dashboard, "subiu de B1 para B1+" em speaking |

**TODOs:**
- [ ] Criar model `SkillSnapshot` com scores por área e data
- [ ] Job semanal que recalcula skills a partir de atividades
- [ ] Substituir placeholders do dashboard (`+8%`, `quizAccuracy` fake)
- [ ] Mostrar "pontos fracos da semana" com CTA para lição/quiz direcionado

#### A2. Repetição espaçada (SRS)

**Por que:** Vocabulário sem SRS não gruda. Duolingo tem; o Norte precisa ter — mas **filtrado por goal**.

| Item | Detalhe |
|------|---------|
| **O quê** | Flashcards de palavras erradas em lições + chat + quiz |
| **Algoritmo** | SM-2 (Anki) ou FSRS (mais moderno) |
| **Tech** | Novo model `VocabCard` (userId, word, ease, interval, nextReview) |
| **UI** | 5 cards/dia na trilha ou aba dedicada "Revisar" |

**TODOs:**
- [ ] Extrair palavras de erros em `evaluateSpeech`, quiz wrong answers, chat corrections
- [ ] Implementar algoritmo SM-2 em `src/lib/srs/`
- [ ] API `GET/POST /api/review` com fila diária
- [ ] Push às 13h: "3 palavras para revisar antes do almoço"
- [ ] Feature Pro: revisão ilimitada

#### A3. Diagnóstico contínuo (re-assessment)

**Por que:** CEFR só no onboarding fica desatualizado. Prova de evolução = retenção + conversão Pro.

| Item | Detalhe |
|------|---------|
| **O quê** | Mini-diagnóstico a cada 4 semanas ou 20 lições |
| **Tech** | Gemini gera 10 questões adaptativas baseadas em weak skills |
| **UI** | Modal "Hora de medir seu progresso" + certificado ao subir de nível |

**TODOs:**
- [ ] Trigger por `lessonsCompleted % 20` ou tempo
- [ ] `POST /api/assessment/reassess` com prompt adaptativo
- [ ] Atualizar `diagnosedLevel` com histórico em `Assessment`
- [ ] Certificado PDF (Pro) ao atingir novo nível CEFR

---

### Pilar B — Speaking & pronúncia de verdade

**Por que:** O feedback mais comum dos testadores foi na gravação. Speaking é a dor #1 de brasileiros.

#### B1. Avaliação de pronúncia com IA

Substituir Levenshtein por análise semântica + fonética.

| Item | Detalhe |
|------|---------|
| **O quê** | Score 0–100, palavras problemáticas, sugestão de como pronunciar |
| **Tech opção 1** | Gemini multimodal (áudio → feedback) — já tem API key |
| **Tech opção 2** | Azure Speech Pronunciation Assessment (mais preciso, pago) |
| **Tech opção 3** | OpenAI Whisper + Gemini para análise do transcript |
| **Custo** | Começar com Gemini audio; escalar para Azure se precisão for crítica |

**TODOs:**
- [ ] Gravar áudio real (MediaRecorder) além do SpeechRecognition
- [ ] `POST /api/speech/evaluate` — envia áudio, retorna score + feedback PT
- [ ] Substituir `evaluateSpeech()` em `build-steps.ts` por chamada API
- [ ] Mostrar onda de áudio + replay da gravação do usuário
- [ ] Limitar free: 5 avaliações/dia; Pro: ilimitado

#### B2. Shadowing (repetir após nativo)

| Item | Detalhe |
|------|---------|
| **O quê** | TTS fala frase → usuário repete → compara ritmo e entonação |
| **Tech** | Web Audio API + TTS + speech evaluate |
| **Diferencial** | Frases do goal (stand-up para tech, pitch para business) |

**TODOs:**
- [ ] Novo step `shadow` na lição
- [ ] Biblioteca de frases por goal e nível (IA gera ou curadoria)
- [ ] UI com botão "Ouvir nativo" → "Sua vez" → feedback

#### B3. Role-play guiado (cenários)

| Item | Detalhe |
|------|---------|
| **O quê** | "Você está no aeroporto" / "Daily stand-up" — IA conduz o diálogo |
| **Tech** | Estender chat com `mode: "roleplay"` e system prompt de cenário |
| **Pro** | Cenários avançados (negociação salarial, system design interview) |

**TODOs:**
- [ ] `RolePlayScenario` type + lista por goal em `src/lib/data/scenarios.ts`
- [ ] Chat UI: seletor de cenário antes de iniciar
- [ ] Feedback estruturado ao final (fluency, vocabulary, grammar)

---

### Pilar C — Conteúdo que escala (sem virar Duolingo)

**Por que:** 36 lições estáticas esgotam em semanas. IA + curadoria híbrida resolve.

#### C1. Lições geradas por IA (daily lesson v2)

| Item | Detalhe |
|------|---------|
| **O quê** | Cada dia: frase, vocabulário, dica gramatical, exercícios — tudo pelo goal+nível |
| **Tech** | Gemini com prompt estruturado (já existe padrão em `quiz.service.ts`) |
| **Cache** | Salvar em `DailyLesson` model por userId+date (como quiz) |
| **Fallback** | `lessons.ts` estático se API falhar |

**TODOs:**
- [ ] `src/services/lesson.service.ts` — `generateDailyLesson(goal, level, trailIndex)`
- [ ] Model `DailyLessonCache` no MongoDB
- [ ] Alinhar títulos da trilha (`trail.ts`) com conteúdo gerado
- [ ] Validar qualidade com schema Zod na resposta da IA

#### C2. Biblioteca de micro-lições (5 min)

| Item | Detalhe |
|------|---------|
| **O quê** | "Como pedir raise em inglês", "Email de follow-up pós-entrevista" |
| **Formato** | Frase-chave + 3 exercícios + 1 role-play |
| **Monetização** | 2/semana free; ilimitado Pro |

**TODOs:**
- [ ] Nova rota `/micro` ou seção no dashboard
- [ ] Tags: `email`, `meeting`, `interview`, `travel`, `small-talk`
- [ ] IA gera sob demanda ou banco curado de 50 micro-lições

#### C3. Conteúdo community-driven (fase 2)

| Item | Detalhe |
|------|---------|
| **O quê** | Usuários Pro submetem frases do trabalho; IA transforma em lição |
| **Tech** | Moderação admin + Gemini sanitization |
| **Diferencial** | Inglês do mundo real brasileiro (não só textbook) |

---

### Pilar D — Retenção & hábito (produto, não só push)

**Por que:** Push ajuda, mas hábito vem de loop fechado: praticar → ver progresso → sentir evolução.

#### D1. Metas semanais reais

| Item | Detalhe |
|------|---------|
| **O quê** | `practiceDaysPerWeek` e `practiceMinutesPerDay` já existem no perfil — usar de verdade |
| **Tech** | Tracking de `studySession` com duração; comparar com meta |
| **UI** | WeeklyGoalCard com dados reais, não proxy de streak |

**TODOs:**
- [ ] Registrar `sessionStart`/`sessionEnd` no client (lessons, chat, quiz)
- [ ] `POST /api/progress` type `study` com `minutes`
- [ ] Dashboard: "3/5 dias · 45/75 min esta semana"
- [ ] Push integrado: se meta em risco na quinta, nudge extra

#### D2. Streak inteligente + freeze

| Item | Detalhe |
|------|---------|
| **O quê** | Streak freeze 1x/mês (Pro), comeback após 3 dias inativo |
| **Tech** | Campos `streakFreezes`, `longestStreak` no User |
| **Push fase 2** | Comeback após inatividade (já documentado em PUSH_NOTIFICATIONS.md) |

**TODOs:**
- [ ] Implementar `streakFreeze` (Pro perk)
- [ ] Push "sentimos sua falta" após 3 dias sem `lastStudyDate`
- [ ] Celebrar milestones: 7, 30, 100 dias

#### D3. Relatório semanal (email ou in-app)

| Item | Detalhe |
|------|---------|
| **O quê** | PDF/in-app: tempo estudado, skills, palavras novas, erros comuns |
| **Tech** | Gemini resume a semana; `@react-pdf/renderer` ou HTML → PDF |
| **Pro** | Feature exclusiva — justifica assinatura |

**TODOs:**
- [ ] `GET /api/report/weekly` — agrega dados da semana
- [ ] Template PDF com logo Norte
- [ ] Envio via Resend/SendGrid (domingo 20h)
- [ ] Card no dashboard: "Seu relatório está pronto"

---

### Pilar E — Monetização que financia o produto

**Por que:** Sem receita, não dá para pagar APIs de voz/IA nem criar conteúdo.

#### E1. Enforçar free vs Pro (urgente)

Documentado em `MONETIZACAO_E_COMUNICACAO.md`, **não implementado no código**.

| Free | Pro |
|------|-----|
| 1 lição/dia na trilha | Trilha ilimitada |
| 5 msgs chat/dia | Chat ilimitado |
| 5 avaliações de voz/dia | Ilimitado |
| Quiz diário | Quiz + revisão SRS ilimitada |
| — | Entrevista IA (já existe) |
| — | Relatório semanal |
| — | Cenários role-play avançados |

**TODOs:**
- [ ] Middleware ou helper `requirePro(feature)` em APIs
- [ ] Paywall UI nos momentos certos (após 1ª lição, ao abrir entrevista)
- [ ] Contador visível: "2/5 mensagens hoje"
- [ ] Trial 7 dias Pro no cadastro

#### E2. Pagamentos Brasil

| Item | Detalhe |
|------|---------|
| **O quê** | PIX + cartão em BRL |
| **Tech** | Stripe PIX (BR) ou Mercado Pago |
| **Preço** | R$ 39,90/mês · R$ 299/ano (alinhar com doc de monetização) |

**TODOs:**
- [ ] `SUBSCRIPTION_MODE=stripe` em produção
- [ ] Price IDs em BRL no Stripe
- [ ] Página `/pro` com benefícios claros e prova social
- [ ] Webhook testado end-to-end

#### E3. Plano Tech Career (vertical premium)

| Item | Detalhe |
|------|---------|
| **O quê** | Tudo do Pro + trilha tech exclusiva + entrevista system design + certificado |
| **Preço** | R$ 59,90/mês |
| **CAC** | LinkedIn, comunidades dev, Product Hunt |

**TODOs:**
- [ ] `plan: "tech"` no subscription schema
- [ ] Conteúdo exclusivo em `trail.ts` para tech_career+
- [ ] Landing `/tech` para aquisição

#### E4. B2B (fase 3)

| Item | Detalhe |
|------|---------|
| **O quê** | Dashboard para RH: progresso do time, relatórios agregados |
| **Tech** | `Organization` model, seats, admin invite |
| **Preço** | R$ 29/usuário/mês (mín. 10) |

---

### Pilar F — Infraestrutura & qualidade

#### F1. Observabilidade

| Item | Detalhe |
|------|---------|
| **Tech** | Sentry (erros), PostHog ou Mixpanel (funil), Vercel Analytics |
| **Métricas chave** | D1/D7 retention, lesson completion, quiz completion, Pro conversion |

**TODOs:**
- [ ] Instalar Sentry no Next.js
- [ ] Eventos: `lesson_completed`, `quiz_completed`, `chat_message`, `pro_checkout_started`
- [ ] Dashboard interno de funil (ou Metabase + MongoDB)

#### F2. LGPD completo

**TODOs:**
- [ ] Cascade delete: `InterviewSession`, `LessonCompletion` no `DELETE /api/account`
- [ ] `GET /api/account/export` — export JSON dos dados do usuário
- [ ] CSP header (mencionado em SEGURANCA.md)

#### F3. Performance & offline

**TODOs:**
- [ ] Cache de lição do dia no service worker (Serwist)
- [ ] Quiz e vocabulário offline para revisão em metrô/avião
- [ ] Lazy load de rotas pesadas (interview, chat)

---

## 4. Roadmap por fases

### Fase 1 — Fundação (0–6 semanas) · *Tornar o produto confiável*

Prioridade: corrigir o que testadores reclamaram + preparar monetização.

| # | Entrega | Impacto | Esforço |
|---|---------|---------|---------|
| 1 | Enforçar limites free vs Pro | Receita | M |
| 2 | Dashboard com métricas reais | Confiança | M |
| 3 | Pronúncia com IA (Gemini audio) | Diferencial speaking | L |
| 4 | Stripe BRL em produção | Receita | S |
| 5 | SRS básico (10 cards/dia) | Retenção | L |
| 6 | Push fase 2 (comeback inativo) | Retenção | S |

### Fase 2 — Diferenciação (6–12 semanas) · *Ir além dos concorrentes*

| # | Entrega | Impacto | Esforço |
|---|---------|---------|---------|
| 7 | Lições geradas por IA diárias | Conteúdo infinito | L |
| 8 | Role-play por cenário | Conversação real | M |
| 9 | Re-assessment CEFR + certificado | Prova de evolução | M |
| 10 | Relatório semanal PDF (Pro) | Valor percebido | M |
| 11 | Shadowing nas lições | Speaking | M |
| 12 | Micro-lições (biblioteca) | Engajamento | M |

### Fase 3 — Escala (3–6 meses) · *Produto de categoria*

| # | Entrega | Impacto | Esforço |
|---|---------|---------|---------|
| 13 | Plano Tech Career | ARPU | L |
| 14 | B2B / times | Novo mercado | XL |
| 15 | App nativo (opcional) | App Store presence | XL |
| 16 | Comunidade / frases reais | UGC + viral | L |
| 17 | Parcerias (bootcamps, edtechs) | Aquisição | M |
| 18 | A/B de copy push + onboarding | Otimização | S |

**Legenda esforço:** S = dias · M = 1–2 semanas · L = 2–4 semanas · XL = 1+ mês

---

## 5. Stack recomendada para novas features

| Necessidade | Tecnologia recomendada | Por quê |
|-------------|------------------------|---------|
| IA texto/quiz/lições | **Gemini 2.5 Flash** (já integrado) | Custo baixo, JSON mode, PT-BR |
| IA pronúncia (áudio) | Gemini multimodal → depois **Azure Speech** | Precisão quando escalar |
| Transcrição | OpenAI **Whisper** API | Melhor que Web Speech em sotaque BR |
| TTS natural | **ElevenLabs** ou Google Cloud TTS | Voz mais natural que browser TTS |
| Email transacional | **Resend** | DX simples, bom para relatórios |
| Analytics | **PostHog** (self-host ou cloud) | Funil + feature flags |
| Erros | **Sentry** | Next.js native |
| PDF | `@react-pdf/renderer` | Relatório semanal |
| Pagamentos BR | **Stripe PIX** ou Mercado Pago | PIX é must-have BR |
| Fila/jobs | **Vercel Cron** + API routes | Re-assessment semanal, relatórios |
| Busca de conteúdo | MongoDB text index | Micro-lições por tag |

### APIs de voz — comparativo

| Serviço | Pronúncia | Custo | Integração |
|---------|-----------|-------|------------|
| Web Speech API | ⭐⭐ | Grátis | Já tem |
| Gemini Audio | ⭐⭐⭐ | Baixo | Estender IA atual |
| Azure Speech | ⭐⭐⭐⭐⭐ | Médio | SDK REST |
| ELSA API | ⭐⭐⭐⭐⭐ | Alto | Parceria B2B |

**Recomendação:** Gemini audio no curto prazo → Azure quando tiver usuários pagantes.

---

## 6. O que realmente ajuda no inglês (princípios de produto)

Para não virar "mais um app com IA", cada feature deve passar neste filtro:

### ✅ Faz o usuário aprender de verdade

1. **Input compreensível** — Conteúdo no nível CEFR + 1 (i+1)
2. **Output forçado** — Falar e escrever, não só clicar opções
3. **Feedback imediato** — Correção em português, com exemplo correto
4. **Repetição no momento certo** — SRS nas palavras que errou
5. **Contexto do objetivo** — Tech learner não quer frase de aeroporto
6. **Prova de evolução** — Re-diagnóstico mostra que valeu a pena

### ❌ Evitar (armadilhas comuns)

- XP infinito sem aprendizado associado
- Chat IA que só conversa sem corrigir
- Lições que nunca aumentam de dificuldade
- Pronúncia que aceita qualquer coisa
- Gamificação que substitui prática real

### Loop de aprendizado ideal no Norte

```
Diagnóstico → Lição do dia (input) → Exercícios (output) → Speaking (output)
      ↑                                                        ↓
  Re-assessment ← Relatório semanal ← SRS revisão ← Feedback IA
```

---

## 7. Métricas de sucesso (north star)

| Métrica | Meta inicial | Meta 6 meses |
|---------|--------------|--------------|
| D7 retention | 25% | 40% |
| Lições completadas/semana (ativo) | 3 | 5 |
| Speaking attempts/semana | 2 | 5 |
| Quiz completion (diário) | 40% | 60% |
| Free → Pro conversion | 2% | 5% |
| NPS | 30 | 50 |
| Churn Pro mensal | < 8% | < 5% |

**North Star Metric sugerida:** *minutos de speaking practice por usuário ativo por semana*

Porque speaking é a dor principal do público-alvo (profissionais BR) e é o que menos apps resolvem bem.

---

## 8. Backlog consolidado (checklist master)

### Crítico (próximas sprints)
- [ ] Enforçar limites free vs Pro no código
- [ ] Stripe BRL + trial 7 dias
- [ ] Dashboard com dados reais (não placeholders)
- [ ] Pronúncia via IA (substituir Levenshtein)
- [ ] Alinhar trilha (`trail.ts`) com conteúdo das lições
- [ ] Cascade delete completo (LGPD)

### Alto impacto
- [ ] SRS / flashcards de vocabulário
- [ ] Lições diárias geradas por Gemini
- [ ] Role-play por cenário no chat
- [ ] Relatório semanal (Pro)
- [ ] Re-assessment CEFR periódico
- [ ] Push comeback (usuário inativo 3+ dias)
- [ ] Metas semanais reais (dias + minutos)

### Diferenciação médio prazo
- [ ] Shadowing nas lições
- [ ] Micro-lições temáticas
- [ ] Plano Tech Career
- [ ] Certificado PDF por nível
- [ ] Whisper para transcrição mais precisa
- [ ] TTS premium (ElevenLabs)

### Escala
- [ ] B2B dashboard para times
- [ ] Analytics (PostHog + Sentry)
- [ ] A/B testing de onboarding
- [ ] Conteúdo community-driven
- [ ] App nativo (React Native ou Capacitor)

---

## 9. Referências internas

| Documento | Conteúdo |
|-----------|----------|
| `docs/MONETIZACAO_E_COMUNICACAO.md` | Preços, personas, canais de aquisição |
| `docs/PUSH_NOTIFICATIONS.md` | Fases 2–3 de retenção |
| `docs/SEGURANCA.md` | Hardening de APIs e LGPD |
| `docs/PWA_INSTALL.md` | Distribuição sem App Store |
| `src/services/quiz.service.ts` | Padrão de IA generativa (replicar para lições) |
| `src/lib/data/lessons.ts` | Conteúdo estático atual |
| `src/types/index.ts` | Goals e níveis CEFR |

---

*Última atualização: junho 2026 — após correções de gravação, quiz IA e notificações em slots fixos.*
