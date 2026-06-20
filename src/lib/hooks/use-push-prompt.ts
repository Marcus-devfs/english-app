"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PUSH_CARD_DISMISS_DAYS,
  PUSH_CARD_DISMISSED_KEY,
  PUSH_MODAL_SEEN_KEY,
} from "@/lib/constants/storage";
import { isPushSupported } from "@/lib/pwa/detect-platform";

interface PushPromptState {
  loading: boolean;
  pushSupported: boolean;
  pushEnabled: boolean;
  showModal: boolean;
  showCard: boolean;
  markModalSeen: () => void;
  dismissCard: () => void;
  refresh: () => Promise<void>;
}

function isCardDismissedRecently(): boolean {
  const raw = localStorage.getItem(PUSH_CARD_DISMISSED_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < PUSH_CARD_DISMISS_DAYS;
}

export function usePushPrompt(): PushPromptState {
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const refresh = useCallback(async () => {
    const supported = isPushSupported();
    setPushSupported(supported);

    if (!supported) {
      setPushEnabled(false);
      setShowModal(false);
      setShowCard(false);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      const enabled =
        data.success &&
        data.data.user.hasPushSubscription &&
        data.data.user.preferences?.notificationsEnabled;

      setPushEnabled(Boolean(enabled));

      if (enabled) {
        setShowModal(false);
        setShowCard(false);
        return;
      }

      const modalSeen = localStorage.getItem(PUSH_MODAL_SEEN_KEY) === "1";
      setShowModal(!modalSeen);
      setShowCard(modalSeen && !isCardDismissedRecently());
    } catch {
      setPushEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markModalSeen = useCallback(() => {
    localStorage.setItem(PUSH_MODAL_SEEN_KEY, "1");
    setShowModal(false);
    if (!isCardDismissedRecently()) {
      setShowCard(true);
    }
  }, []);

  const dismissCard = useCallback(() => {
    localStorage.setItem(PUSH_CARD_DISMISSED_KEY, String(Date.now()));
    setShowCard(false);
  }, []);

  return {
    loading,
    pushSupported,
    pushEnabled,
    showModal,
    showCard,
    markModalSeen,
    dismissCard,
    refresh,
  };
}
