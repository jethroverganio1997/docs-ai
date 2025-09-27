"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootProvider } from "fumadocs-ui/provider";
import { useMemo } from "react";
import DefaultSearchDialog from "../components/search";
// import { SearchDialog } from "fumadocs-ui/components/dialog/search";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);
  return (
    <RootProvider
      search={{
        SearchDialog: DefaultSearchDialog,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </RootProvider>
  );
}
