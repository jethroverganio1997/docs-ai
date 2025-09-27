"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "../lib/supabase/client";

export function useSupabaseHeaders() {
  const supabase = createClient();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        return;
      }
      setToken(data.session?.access_token ?? null);
    }

    fetchSession();
  }, [supabase]);

  const headers = useMemo(
    () => ({
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  return headers;
}
