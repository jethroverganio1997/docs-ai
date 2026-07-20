"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getDocsChatApiUrl,
  type ChatApiResponse,
  type ChatRequestMessage,
} from "../api";

export type MessageMetadata = {
  sources?: string[];
};

type ChatStatus = "ready" | "submitted" | "streaming";

type ChatMessagePart = {
  type: "text";
  text: string;
};

export type CustomUIMessage = {
  id: string;
  role: "user" | "assistant";
  parts?: ChatMessagePart[];
  metadata?: MessageMetadata;
};

type SetMessagesAction =
  | CustomUIMessage[]
  | ((messages: CustomUIMessage[]) => CustomUIMessage[]);

export type UseDocsChatHelpers = {
  messages: CustomUIMessage[];
  status: ChatStatus;
  sendMessage: (message: { text: string }) => Promise<void>;
  regenerate: () => Promise<void>;
  stop: () => void;
  setMessages: (messages: SetMessagesAction) => void;
};

function createMessage(
  role: CustomUIMessage["role"],
  text: string,
  metadata?: MessageMetadata,
): CustomUIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [
      {
        type: "text",
        text,
      },
    ],
    metadata,
  };
}

function toRequestMessages(messages: CustomUIMessage[]): ChatRequestMessage[] {
  return messages.map((message) => ({
    role: message.role,
    parts: (message.parts ?? [])
      .filter((part) => part.type === "text")
      .map((part) => ({
        type: "text",
        text: part.text,
      })),
  }));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to generate an answer.";
}

function normalizeSources(payload: ChatApiResponse) {
  if (!Array.isArray(payload.sources)) {
    return [];
  }

  return payload.sources.filter((source): source is string =>
    typeof source === "string" && source.length > 0
  );
}

export function useDocsChat(): UseDocsChatHelpers {
  const [messages, setMessagesState] = useState<CustomUIMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  const setMessages = (nextMessages: SetMessagesAction) => {
    setMessagesState((currentMessages) =>
      typeof nextMessages === "function"
        ? nextMessages(currentMessages)
        : nextMessages
    );
  };

  const stop = () => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  };

  const requestAnswer = async (requestMessages: CustomUIMessage[]) => {
    if (requestMessages.length === 0) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("submitted");

    try {
      const response = await fetch(getDocsChatApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: toRequestMessages(requestMessages),
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      const responseText = await response.text();
      let payload: ChatApiResponse = {};

      if (responseText) {
        try {
          payload = JSON.parse(responseText) as ChatApiResponse;
        } catch {
          payload = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" && payload.error
            ? payload.error
            : `Request failed with status ${response.status}.`,
        );
      }

      if (requestId !== requestIdRef.current) {
        return;
      }

      const answer = typeof payload.answer === "string"
        ? payload.answer.trim()
        : "";

      if (!answer) {
        throw new Error("Chat API returned an empty answer.");
      }

      setMessagesState([
        ...requestMessages,
        createMessage("assistant", answer, {
          sources: normalizeSources(payload),
        }),
      ]);
    } catch (error) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return;
      }

      toast.error(getErrorMessage(error));
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }

      if (requestId === requestIdRef.current) {
        setStatus("ready");
      }
    }
  };

  const sendMessage = async ({ text }: { text: string }) => {
    const trimmedText = text.trim();

    if (!trimmedText || status !== "ready") {
      return;
    }

    const nextMessages = [...messages, createMessage("user", trimmedText)];
    setMessagesState(nextMessages);
    await requestAnswer(nextMessages);
  };

  const regenerate = async () => {
    if (messages.length === 0 || status !== "ready") {
      return;
    }

    const lastMessage = messages.at(-1);
    const nextMessages = lastMessage?.role === "assistant"
      ? messages.slice(0, -1)
      : messages;

    if (nextMessages.length === 0) {
      return;
    }

    setMessagesState(nextMessages);
    await requestAnswer(nextMessages);
  };

  return {
    messages,
    status,
    sendMessage,
    regenerate,
    stop,
    setMessages,
  };
}
