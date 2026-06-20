"use client";

import { useState } from "react";
import { PUSH_MODAL_SEEN_KEY } from "@/lib/constants/storage";
import { usePushPrompt } from "@/lib/hooks/use-push-prompt";
import { enablePushNotifications } from "@/lib/pwa/enable-push";
import { NotificationPromptModal } from "@/components/pwa/notification-prompt-modal";
import { NotificationPromptCard } from "@/components/pwa/notification-prompt-card";
import {
  NotificationPermissionHelp,
  useNotificationPermissionWatch,
} from "@/components/pwa/notification-permission-help";

interface PushPromptProps {
  showCard?: boolean;
}

export function PushPrompt({ showCard = true }: PushPromptProps) {
  const {
    loading,
    pushSupported,
    showModal,
    showCard: showCardState,
    markModalSeen,
    dismissCard,
    refresh,
  } = usePushPrompt();

  const { isDenied, refresh: refreshPermission } = useNotificationPermissionWatch();
  const [enabling, setEnabling] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function handleEnable() {
    setEnabling(true);
    try {
      const result = await enablePushNotifications();
      if (result.success) {
        localStorage.setItem(PUSH_MODAL_SEEN_KEY, "1");
        setShowHelp(false);
        await refresh();
        refreshPermission();
        return;
      }

      if (result.reason === "denied" || result.reason === "dismissed") {
        setShowHelp(true);
        return;
      }

      alert(
        "Não foi possível ativar. Instale o app na tela inicial ou tente novamente mais tarde."
      );
    } finally {
      setEnabling(false);
    }
  }

  function handleDismissModal() {
    markModalSeen();
  }

  if (loading || !pushSupported) return null;

  return (
    <>
      <NotificationPromptModal
        open={showModal}
        loading={enabling}
        isDenied={isDenied}
        onEnable={handleEnable}
        onShowHelp={() => setShowHelp(true)}
        onDismiss={handleDismissModal}
      />

      {showCard && showCardState && !showModal && (
        <NotificationPromptCard
          loading={enabling}
          isDenied={isDenied}
          onEnable={handleEnable}
          onShowHelp={() => setShowHelp(true)}
          onDismiss={dismissCard}
        />
      )}

      <NotificationPermissionHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
        onRetry={handleEnable}
        retryLoading={enabling}
      />
    </>
  );
}
