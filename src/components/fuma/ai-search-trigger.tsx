"use client";
import { type ButtonHTMLAttributes, useState } from "react";
import { type Session } from "@supabase/supabase-js";

// lazy load the dialog
import AISearch from "./ai-search"; // Use a standard import


/**
 * The trigger component for AI search dialog.
 *
 * Use it like a normal button component.
 */
export function AISearchTrigger(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { session: Session | null }
) {
  const { session, ...rest } = props;
  const [open, setOpen] = useState<boolean>();

  return (
    <>
      {open !== undefined ? (
        <AISearch open={open} onOpenChange={setOpen} session={session} />
      ) : null}
      <button {...rest} onClick={() => setOpen(true)} />
    </>
  );
}
