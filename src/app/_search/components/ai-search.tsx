"use client";
import { RemoveScroll } from "react-remove-scroll";
import {
  type ComponentProps,
  createContext,
  type SyntheticEvent,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Loader2, RefreshCw, SearchIcon, Send, X } from "lucide-react";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { type UIMessage, useChat, type UseChatHelpers } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Markdown } from "../../../components/mdx/markdown";
import { Presence } from "@radix-ui/react-presence";
import { cn } from "fumadocs-ui/utils/cn";
import Link from "next/link";
import { getFileName } from "../../../lib/helpers";
import { createClient } from "../../../lib/supabase/client";
import { Skeleton } from "../../../components/ui/skeleton";

// Define the shape of your custom metadata
type MessageMetadata = {
  sources?: string[];
};

export type CustomUIMessage = UIMessage<MessageMetadata>;

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<CustomUIMessage>;
} | null>(null);

function useChatContext() {
  return use(Context)!.chat;
}

function useAIContext() {
  const context = use(Context);
  if (!context) {
    throw new Error("useAIContext must be used within the Context.Provider");
  }
  return context;
}

function SearchAIActions() {
  const { messages, status, setMessages, regenerate } = useChatContext();
  const isLoading = status === "streaming";

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === "assistant" && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: "secondary",
              size: "sm",
              className: "rounded-full gap-1.5",
            })
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: "secondary",
            size: "sm",
            className: "rounded-full",
          })
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </button>
    </>
  );
}

function SearchAIInput(props: ComponentProps<"form">) {
  const supabase = createClient();
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";
  const onStart = async (e?: SyntheticEvent) => {
    e?.preventDefault();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    void sendMessage(
      { text: input },
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
      }
    );
    setInput("");
  };

  useEffect(() => {
    if (isLoading) document.getElementById("nd-ai-input")?.focus();
  }, [isLoading]);

  return (
    <form
      {...props}
      className={cn("flex items-start pe-2", props.className)}
      onSubmit={onStart}
    >
      <Input
        value={input}
        placeholder={isLoading ? "AI is answering..." : "Ask AI"}
        autoFocus
        className="p-4"
        disabled={status === "streaming" || status === "submitted"}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === "Enter") {
            onStart(event);
          }
        }}
      />
      {isLoading ? (
        <button
          key="bn"
          type="button"
          className={cn(
            buttonVariants({
              color: "secondary",
              className: "transition-all rounded-full mt-2 gap-2",
            })
          )}
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin text-fd-muted-foreground" />
          Abort Answer
        </button>
      ) : (
        <button
          key="bn"
          type="submit"
          className={cn(
            buttonVariants({
              color: "secondary",
              className: "transition-all rounded-full mt-2",
            })
          )}
          disabled={input.length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function List(props: Omit<ComponentProps<"div">, "dir">) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "instant",
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn(
        "fd-scroll-container overflow-y-auto min-w-0 flex flex-col",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<"textarea">) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn("col-start-1 row-start-1", props.className);

  return (
    <div className="grid flex-1">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          "resize-none bg-transparent placeholder:text-fd-muted-foreground focus-visible:outline-none",
          shared
        )}
      />
      <div ref={ref} className={cn(shared, "break-all invisible")}>
        {`${props.value?.toString() ?? ""}\n`}
      </div>
    </div>
  );
}

const roleName: Record<string, string> = {
  user: "you",
  assistant: "feedocs",
};

function Message({
  message,
  ...props
}: { message: CustomUIMessage } & ComponentProps<"div">) {
  const { setOpen } = useAIContext();
  const { status, messages } = useChatContext();
  let markdown = "";

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      markdown += part.text;
    }
  }

  if (
    message.role === "assistant" &&
    markdown.length === 0 &&
    (status == "streaming" || status == "submitted") &&
    messages.at(-1)?.id === message.id
  ) {
    return <AssistantLoading />;
  }

  return (
    <div {...props}>
      <p
        className={cn(
          "mb-1 text-sm font-medium text-fd-muted-foreground",
          message.role === "assistant" && "text-gradient"
        )}
      >
        {roleName[message.role] ?? "unknown"}
      </p>
      <div className="prose text-sm">
        <Markdown text={markdown} />
      </div>
      {message.role === "assistant" &&
      message.metadata?.sources &&
      message.metadata?.sources.length > 0 ? (
        <div className="mt-2 flex flex-row flex-wrap items-center gap-1">
          {(message.metadata.sources as string[]).map((link, i) => (
            <Link
              key={i}
              href={link}
              onClick={() => setOpen(false)}
              className="block bg-secondary text-xs rounded-lg border p-3 hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <p className="font-medium">{getFileName(link)}</p>
              <p className="text-fd-muted-foreground">Reference</p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssistantLoading() {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gradient">
        {roleName.assistant}
      </p>
      <div className="prose text-sm">
        <Skeleton className="w-24 h-5 rounded-sm" />
      </div>
    </div>
  );
}

export function AISearchTrigger() {
  const [open, setOpen] = useState(false);

  //the headers are on onSendMessage
  const chat = useChat<CustomUIMessage>({
    id: "search",
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
    }),
  });

  // NEW: Check if the last message is from the user while loading
  const isWaitingForResponse =
    chat.status === "submitted" &&
    chat.messages[chat.messages.length - 1]?.role === "user";

  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === "/" && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  };

  const onKeyPressRef = useRef(onKeyPress);
  onKeyPressRef.current = onKeyPress;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyPressRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>
      <RemoveScroll enabled={open}>
        <Presence present={open}>
          <div
            className={cn(
              "fixed inset-0 p-2 right-(--removed-body-scroll-bar-size,0) flex flex-col pb-[8.375rem] items-center bg-fd-background/80 backdrop-blur-sm z-50",
              open ? "animate-fd-fade-in" : "animate-fd-fade-out"
            )}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setOpen(false);
                e.preventDefault();
              }
            }}
          >
            <div className="sticky top-0 flex gap-2 items-center py-2 w-full max-w-[600px]">
              <p className="text-xs flex-1 text-fd-muted-foreground">
                Powered by OpenAI
              </p>
              <button
                aria-label="Close"
                tabIndex={-1}
                className={cn(
                  buttonVariants({
                    size: "icon-sm",
                    color: "secondary",
                    className: "rounded-full",
                  })
                )}
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>
            <List
              className="py-10 pr-2 w-full max-w-[600px] overscroll-contain"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, white 4rem, white calc(100% - 2rem), transparent 100%)",
              }}
            >
              <div className="flex flex-col gap-4">
                {chat.messages
                  .filter((msg) => msg.role !== "system")
                  .map((item) => (
                    <Message key={item.id} message={item} />
                  ))}
                {isWaitingForResponse && <AssistantLoading />}
              </div>
            </List>
          </div>
        </Presence>
        <div
          className={cn(
            "fixed bottom-2 transition-[width,height] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] -translate-x-1/2 rounded-2xl border shadow-xl z-50 overflow-hidden",
            open
              ? "w-[min(600px,90vw)] bg-fd-popover h-32"
              : "w-40 h-10 bg-fd-secondary text-fd-secondary-foreground shadow-fd-background"
          )}
          style={{
            left: "calc(50% - var(--removed-body-scroll-bar-size,0px)/2)",
          }}
        >
          <Presence present={!open}>
            <button
              className={cn(
                "absolute inset-0 text-center p-2 text-fd-muted-foreground text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground",
                !open
                  ? "animate-fd-fade-in"
                  : "animate-fd-fade-out bg-fd-accent"
              )}
              onClick={() => setOpen(true)}
            >
              <SearchIcon className="absolute top-1/2 -translate-y-1/2 size-4.5" />
              Ask AI
            </button>
          </Presence>
          <Presence present={open}>
            <div
              className={cn(
                "absolute inset-0 flex flex-col",
                open ? "animate-fd-fade-in" : "animate-fd-fade-out"
              )}
            >
              <SearchAIInput className="flex-1" />
              <div className="flex items-center gap-1.5 p-1 empty:hidden">
                <SearchAIActions />
              </div>
            </div>
          </Presence>
        </div>
      </RemoveScroll>
    </Context>
  );
}
