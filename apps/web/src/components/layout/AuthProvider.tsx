"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, user } = useAuth();
  const { fetch: fetchCount } = useNotificationCount();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) fetchCount();
  }, [user, fetchCount]);

  return <>{children}</>;
}
