import { detectInstallPlatform, isStandalonePwa, type InstallPlatform } from "@/lib/pwa/detect-platform";

export type NotificationPermissionState = "granted" | "denied" | "default" | "unsupported";

export type PushSubscribeFailureReason =
  | "unsupported"
  | "no_vapid"
  | "denied"
  | "dismissed"
  | "api_error";

export type PushSubscribeResult =
  | { success: true }
  | { success: false; reason: PushSubscribeFailureReason };

export interface PermissionHelpStep {
  title: string;
  description: string;
}

export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function getPermissionHelpSteps(
  platform: InstallPlatform = detectInstallPlatform(),
  standalone = isStandalonePwa()
): PermissionHelpStep[] {
  if (platform === "ios") {
    if (standalone) {
      return [
        {
          title: "Abra Ajustes do iPhone",
          description: "Saia do Norte e abra o app Ajustes (Settings).",
        },
        {
          title: "Notificações → Norte",
          description: "Toque em Notificações, encontre Norte na lista e abra.",
        },
        {
          title: "Ative Permitir Notificações",
          description: "Ligue o interruptor. Volte ao Norte e toque em Ativar novamente.",
        },
      ];
    }
    return [
      {
        title: "Instale o Norte na tela inicial",
        description: "No Safari: Compartilhar → Adicionar à Tela de Início. Push no iOS só funciona no app instalado.",
      },
      {
        title: "Abra pelo ícone do Norte",
        description: "Não use o Safari — abra o app pela home do iPhone.",
      },
      {
        title: "Ajustes → Notificações → Norte",
        description: "Se já negou antes, vá em Ajustes do iPhone e permita manualmente.",
      },
    ];
  }

  if (platform === "android") {
    return [
      {
        title: "Toque no cadeado ou ⓘ na barra de endereço",
        description: "No Chrome, ao lado do URL do Norte.",
      },
      {
        title: "Permissões → Notificações",
        description: "Selecione Permitir ou Ativado.",
      },
      {
        title: "Volte ao Norte e tente de novo",
        description: "Perfil → toggle de notificações, ou Ativar no popup.",
      },
    ];
  }

  return [
    {
      title: "Clique no cadeado na barra de endereço",
      description: "Chrome ou Edge, à esquerda do URL.",
    },
    {
      title: "Notificações → Permitir",
      description: "Altere de Bloquear para Permitir.",
    },
    {
      title: "Recarregue e ative de novo",
      description: "F5 na página, depois Perfil → notificações.",
    },
  ];
}

export function getPermissionHelpTitle(denied: boolean, lang: "pt" | "en" = "pt"): string {
  if (lang === "en") {
    return denied
      ? "Notifications blocked — enable in settings"
      : "How to enable notifications";
  }
  return denied
    ? "Notificações bloqueadas — libere nas configurações"
    : "Como ativar notificações";
}

export function getPermissionHelpIntro(denied: boolean, lang: "pt" | "en" = "pt"): string {
  if (lang === "en") {
    return denied
      ? "You tapped Don't Allow. The browser won't ask again — follow the steps below, then try Activate again."
      : "Follow the steps below to allow notifications.";
  }
  return denied
    ? "Você tocou em Não permitir. O navegador não vai perguntar de novo — siga os passos abaixo e depois toque em Ativar novamente."
    : "Siga os passos abaixo para permitir as notificações.";
}
