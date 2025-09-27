"use client";

import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useDocsSearch } from "../hooks/use-docs-search";
import { useSupabaseHeaders } from "../hooks/use-supabase-header";

export default function SupabaseSearchDialog(props: SharedProps) {
  const headers = useSupabaseHeaders();

  const { search, setSearch, query } = useDocsSearch({
    api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search`,
    headers, // <-- pass here
  });

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList
          items={query.data !== "empty" ? query.data : null}
          Item={(props) => (
            <SearchDialogListItem
              {...props}
              renderHighlights={(highlights) =>
                highlights.map((part, i) =>
                  part.styles?.highlight ? (
                    <span
                      key={i}
                      className="bg-violet-200 text-gradient font-semibold rounded px-0.5"
                    >
                      {part.content}
                    </span>
                  ) : (
                    <span key={i}>{part.content}</span>
                  )
                )
              }
            />
          )}
        />
        <SearchDialogFooter>
          <a
            href="https://supabase.com/"
            rel="noreferrer noopener"
            className="ms-auto text-xs text-fd-muted-foreground"
          >
            Search powered by Supabase
          </a>
        </SearchDialogFooter>
      </SearchDialogContent>
    </SearchDialog>
  );
}
