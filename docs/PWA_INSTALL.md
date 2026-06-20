# PWA — Instalação e prompts

Guia das features de instalação do Norte como app e lembretes de notificação.

## Link para compartilhar

Envie este link para novos usuários:

```
https://SEU-DOMINIO.vercel.app/install
```

A página `/install` é uma mini landing page que:

- Detecta **iPhone**, **Android** ou **Desktop**
- Mostra passo a passo para adicionar à tela inicial
- Permite trocar manualmente entre plataformas (tabs)
- Detecta se o app **já está instalado** (modo standalone)

### Onde o link aparece no app

| Local | Ação |
|-------|------|
| `/welcome` | Link "Como instalar na tela inicial" |
| `/profile` | Atalho "Instalar app na tela inicial" |
| `/install` | URL exibida no rodapé para copiar/compartilhar |

## Instruções por plataforma

### iPhone / iPad (Safari)

1. Abrir no **Safari** (não in-app browser do WhatsApp/Instagram)
2. Compartilhar → **Adicionar à Tela de Início**
3. Abrir pelo ícone na home

> Push notifications no iOS **exigem** PWA instalado (iOS 16.4+).

### Android (Chrome)

1. Abrir no **Chrome**
2. Menu (⋮) → **Instalar app** ou **Adicionar à tela inicial**
3. Abrir pelo ícone na home

### Desktop (Chrome / Edge)

1. Ícone de instalação na barra de endereço
2. Confirmar instalação

## Prompt de notificações

Componentes em `src/components/pwa/`:

| Componente | Função |
|------------|--------|
| `PushPrompt` | Orquestra modal + card |
| `NotificationPromptModal` | Popup na 1ª visita ao dashboard |
| `NotificationPromptCard` | Card persistente no dashboard |

### Fluxo

```
Usuário entra no dashboard (pós-onboarding)
    → Push ainda desativado?
        → Modal "Ative os lembretes"
            → Ativar → subscribe + PATCH profile
            → Agora não → card aparece no dashboard
                → Card pode ser dispensado (7 dias)
```

### Condições para exibir

- Browser suporta push (`serviceWorker`, `PushManager`, `Notification`)
- Usuário **não** tem subscription ativa
- Modal: `localStorage` `norte_push_modal_seen` ≠ `"1"`
- Card: modal já visto + card não dispensado nos últimos 7 dias

### Storage keys

Definidas em `src/lib/constants/storage.ts`:

| Key | Uso |
|-----|-----|
| `norte_push_modal_seen` | Modal já exibido/dispensado |
| `norte_push_card_dismissed_at` | Timestamp do dismiss do card |

### Arquivos relacionados

```
src/lib/hooks/use-push-prompt.ts
src/lib/pwa/enable-push.ts
src/lib/pwa/detect-platform.ts
src/app/(app)/dashboard/page.tsx   ← PushPrompt integrado
```

## Middleware

`/install` está em `PUBLIC_ROUTES` — acessível sem login.

Usuários logados também podem acessar `/install` (não redireciona para dashboard).

## Variável de ambiente

```bash
NEXT_PUBLIC_APP_URL=https://ingles-app-kohl.vercel.app
```

Usada na página `/install` para exibir o link completo de compartilhamento.

Veja também: [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md)
