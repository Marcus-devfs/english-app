"use client";

import { useState } from "react";
import { PUSH_MODAL_SEEN_KEY } from "@/lib/constants/storage";
import { usePushPrompt } from "@/lib/hooks/use-push-prompt";
import { enablePushNotifications } from "@/lib/pwa/enable-push";
import { NotificationPromptModal } from "@/components/pwa/notification-prompt-modal";
import { NotificationPromptCard } from "@/components/pwa/notification-prompt-card";

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

  const [enabling, setEnabling] = useState(false);

  async function handleEnable() {
    setEnabling(true);
    try {
      const ok = await enablePushNotifications();
      if (!ok) {
        alert(
          "Não foi possível ativar. Verifique as permissões do navegador ou instale o app na tela inicial."
        );
        return;
      }
      localStorage.setItem(PUSH_MODAL_SEEN_KEY, "1");
      await refresh();
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
        onEnable={handleEnable}
        onDismiss={handleDismissModal}
      />

      {showCard && showCardState && !showModal && (
        <NotificationPromptCard
          loading={enabling}
          onEnable={handleEnable}
          onDismiss={dismissCard}
        />
      )}
    </>
  );
}
