"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SubscriptionContextValue {
  isPro: boolean;
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPro: false,
  loading: true,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setIsPro(Boolean(data.data.user.subscription?.isPro));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isPro, loading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
