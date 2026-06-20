# Push Notifications — Norte

Documentação do sistema de notificações push (Web Push + PWA).

> Instalação do app e prompt de ativação: [PWA_INSTALL.md](./PWA_INSTALL.md)

## Visão geral

O Norte envia **lembretes personalizados** para usuários que:

- Ativaram notificações no **Perfil**
- Aceitaram permissão no navegador/PWA
- **Ainda não praticaram** no dia (fuso local)

O envio é disparado por um **cron externo** (ex.: [cron-job.org](https://cron-job.org)) que chama a API a cada hora. A inteligência de *quando* e *o que* enviar fica no servidor.

```
cron-job.org (1×/hora)
    → POST /api/push/reminders
        → processReminders()
            → evaluateReminderSchedule()  ← decide SE envia
            → buildPushPayload()          ← monta texto personalizado
            → web-push → Service Worker   ← exibe no celular
```

## Arquitetura de arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/constants/push.ts` | Constantes (slots, quiet hours, limites) |
| `src/lib/push/types.ts` | Tipos TypeScript |
| `src/lib/push/timezone.ts` | Fuso horário do usuário |
| `src/lib/push/scheduler.ts` | Regras de agendamento (slots, cap, quiet hours) |
| `src/lib/push/messages.ts` | Templates por objetivo × tipo × idioma |
| `src/lib/push/personalize.ts` | Monta payload final com variáveis |
| `src/lib/push/process-reminders.ts` | Orquestra envio e persiste estado |
| `src/lib/push/log-notification.ts` | Grava histórico em `notificationlogs` |
| `src/models/NotificationLog.ts` | Schema do histórico |
| `src/lib/push/web-push.ts` | Integração VAPID / web-push |
| `src/lib/push/client.ts` | Subscribe/unsubscribe no browser |
| `src/app/api/push/reminders/route.ts` | Endpoint do cron |
| `src/app/api/push/subscribe/route.ts` | Registro de subscription |
| `src/app/sw.ts` | Service worker — exibe notificação |

## Tipos de notificação (Fase 1)

| Tipo | Quando | Tom |
|------|--------|-----|
| `daily_invite` | 1º push do dia | Convite leve, personalizado pelo objetivo |
| `gentle_nudge` | 2º push, streak &lt; 3 | Reforço amigável |
| `streak_risk` | 2º push, streak ≥ 3 | Urgência suave — streak em risco |

## Personalização

Variáveis interpoladas nos templates:

- `{firstName}` — primeiro nome
- `{minutes}` — meta diária (`practiceMinutesPerDay`)
- `{streak}` — dias de streak

Mensagens variam por:

- **`goal`** — tech_career, travel, business, conversation, etc.
- **`language`** — pt ou en (preferência do app)
- **`type`** — daily_invite / gentle_nudge / streak_risk

Deep link por objetivo:

| Goal | URL ao tocar |
|------|--------------|
| tech_career, career_abroad, business, academic | `/trilha` |
| travel | `/vocabulary` |
| conversation | `/chat` |

## Horários e limites (Fase 1)

### Modo "Qualquer horário (padrão)" (`reminderHour = -1`)

| Push | Horário (fuso local) |
|------|----------------------|
| 1º | **8h** |
| 2º | **12h** |
| 3º | **19h** (flexível 19h–21h se perdeu slots anteriores) |
| 4º | **21h** |

### Modo horário fixo (ex.: 18h)

| Push | Horário |
|------|---------|
| 1º | Horário escolhido |
| 2º–4º | **12h, 19h, 21h** (só se o horário fixo for antes das 19h) |

Se o usuário escolhe 19h ou mais tarde → **apenas 1 push/dia**.

### Regras globais

| Regra | Valor |
|-------|-------|
| Quiet hours | **22h – 7h** (não envia) |
| Máx. pushes/dia | **4** (5 se streak ≥ 14) |
| Cooldown entre pushes | **2 horas** |
| Se praticou hoje | **0 pushes** |

## Estado no MongoDB

Campo `notificationState` no documento `User`:

```typescript
{
  date: "2026-06-20",       // dia no fuso do usuário
  sentCount: 1,             // quantos pushes enviados hoje
  lastSentAt: ISODate(),    // timestamp do último
  lastType: "daily_invite"  // tipo do último push
}
```

Reset automático: se `date !== hoje`, `sentCount` é tratado como 0.

## Histórico (`notificationlogs`)

Cada tentativa de envio gera um documento na collection **`notificationlogs`**:

```typescript
{
  userId: ObjectId,
  userEmail: "dallila.almeida@outlook.com",
  userName: "Dallila Almeida",
  type: "daily_invite",
  title: "Norte · Inglês para viagem ✈️",
  body: "Oi Dallila! 15 min de frases úteis...",
  url: "/vocabulary",
  status: "sent",              // ou "failed"
  localDate: "2026-06-20",
  timezone: "America/Sao_Paulo",
  slotHour: 19,
  sentCountAfter: 1,           // qual push do dia (1–4)
  devicesTargeted: 1,
  devicesDelivered: 1,
  scheduleReason: "scheduled",
  createdAt: ISODate()
}
```

Consultas úteis no Atlas:

```js
// Por usuário
db.notificationlogs.find({ userEmail: "dallila.almeida@outlook.com" }).sort({ createdAt: -1 })

// Hoje
db.notificationlogs.find({ localDate: "2026-06-20" }).sort({ createdAt: -1 })

// Falhas
db.notificationlogs.find({ status: "failed" })
```

API autenticada: `GET /api/notifications?limit=20` — histórico do usuário logado.

No app: **Perfil → Histórico de notificações** (últimas 8).

## Configuração

### Variáveis de ambiente

```bash
# Gerar chaves VAPID
npx web-push generate-vapid-keys

# Gerar secret do cron
openssl rand -base64 32
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública VAPID |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID |
| `VAPID_SUBJECT` | Seu email: `mailto:seu@email.com` |
| `CRON_SECRET` | Bearer token para proteger `/api/push/reminders` |

### Cron externo (Vercel Hobby)

Plano gratuito da Vercel limita cron nativo a 1×/dia. Use **cron-job.org**:

- **URL:** `https://SEU-DOMINIO.vercel.app/api/push/reminders`
- **Method:** POST
- **Header:** `Authorization: Bearer SEU_CRON_SECRET`
- **Schedule:** `0 * * * *` (a cada hora)

O middleware libera `/api/push/reminders` sem sessão — autenticação só via `CRON_SECRET`.

### Teste manual

Força envio (ignora slot e cap, mas não envia se já praticou hoje):

```bash
curl -X POST "https://SEU-DOMINIO/api/push/reminders?force=1" \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

Resposta exemplo:

```json
{
  "success": true,
  "data": {
    "sent": 1,
    "failed": 0,
    "candidates": 1,
    "matched": 1,
    "skipped": {},
    "force": true
  }
}
```

Campo `skipped` explica por que usuários foram ignorados:

| Reason | Significado |
|--------|-------------|
| `already_studied_today` | Já praticou hoje |
| `quiet_hours` | Entre 22h e 7h |
| `daily_cap_reached` | Já recebeu 4+ pushes |
| `cooldown` | Menos de 4h desde o último |
| `wrong_slot` | Hora atual não é slot de envio |
| `no_slot_for_count` | Sem 2º slot configurado |

## Fluxo do usuário

1. Instala PWA (obrigatório no iPhone)
2. **Perfil** → ativa notificações → aceita permissão
3. Escolhe horário ou "Qualquer horário (padrão)"
4. Clica **Salvar**
5. Recebe push nos slots — app **não precisa estar aberto**

## Roadmap

### Fase 1 ✅ (atual)

- [x] Cap 2/dia + quiet hours
- [x] Templates por goal × tipo
- [x] Slots 8h e 19h (modo automático)
- [x] Estado `notificationState`
- [x] Deep links por objetivo

### Fase 2 (futuro)

- [ ] Comeback após dias inativos
- [ ] Meta semanal (`practiceDaysPerWeek`)
- [ ] Reduzir frequência se usuário ignora por 7+ dias

### Fase 3 (futuro)

- [ ] Aprender melhor horário pelo histórico de `lastStudyDate`
- [ ] A/B de copy
- [ ] Resumo semanal (domingo 10h)

## Adicionar novos templates

Edite `src/lib/push/messages.ts`:

```typescript
tech_career: {
  daily_invite: {
    pt: tpl("Título", "Corpo com {firstName} e {minutes}"),
    en: tpl("Title", "Body with {firstName} and {minutes}"),
  },
  // ...
},
```

## iPhone / Android

| Plataforma | Requisito |
|------------|-----------|
| **iPhone** | PWA instalado na tela inicial (iOS 16.4+) |
| **Android** | Chrome ou PWA instalado |
| **Desktop** | Chrome com permissão |

Permissões negadas: usuário deve reativar em Ajustes → Notificações → Norte.
