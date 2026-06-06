import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RealtimeSummary } from "../api/types";
import { useAuth } from "../auth/AuthContext";

const DEFAULT_INTERVAL_MS = 15_000;

export function useRealtime(intervalMs = DEFAULT_INTERVAL_MS) {
  const { token } = useAuth();
  const [summary, setSummary] = useState<RealtimeSummary | null>(null);

  useEffect(() => {
    if (!token) {
      setSummary(null);
      return;
    }

    let active = true;

    function load() {
      if (!token) return;
      api.realtimeSummary(token).then((data) => {
        if (active) setSummary(data);
      }).catch(() => {});
    }

    load();
    const timer = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [token, intervalMs]);

  return summary;
}
