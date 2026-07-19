import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  convertToModelMessages,
  embed,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { matchDocumentEmbeddings } from "@/server/docs/search";

type MessageMetadata = {
  sources?: string[];
};

const openai = createOpenAICompatible({
  name: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
});

export async function POST(request: Request) {
  try {
    const { messages }: { messages?: UIMessage[] } = await request.json();

    if (!messages?.length) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 },
      );
    }

    const lastMessage = messages[messages.length - 1];
    const latestQuestion = (lastMessage.parts ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();

    if (!latestQuestion) {
      return NextResponse.json(
        { error: "The latest message does not contain any text." },
        { status: 400 },
      );
    }

    const { embedding } = await embed({
      model: openai.textEmbeddingModel(
        process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      ),
      value: latestQuestion,
      providerOptions: {
        openai: {
          dimensions: 768,
        },
      },
    });

    const matchedDocuments = await matchDocumentEmbeddings(embedding, {
      matchCount: 5,
      matchThreshold: 0.4,
    });

    const injectedDocs = matchedDocuments.length > 0
      ? matchedDocuments.map(({ content }) => content).join("\n\n")
      : "No matching documentation snippets were found.";

    const sources = [...new Set(matchedDocuments.map(({ url }) => url))];

    const result = streamText({
      model: openai(process.env.OPENAI_CHAT_MODEL ?? "gpt-5-mini"),
      system: `
You are a documentation assistant for a public knowledge base.

Rules:
- Answer only from the provided documentation context or the chat history.
- If the answer is not in the context, say: "Sorry, I don't know how to help with that."
- Keep the answer concise, clear, and factual.
- Do not invent capabilities, links, or steps.
- When relevant, mention closely related documented topics briefly.

Context:
${injectedDocs}
      `.trim(),
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return { sources } satisfies MessageMetadata;
        }
      },
    });
  } catch (error) {
    console.error("Chat API failed", error);
    return NextResponse.json(
      { error: "Failed to generate an answer." },
      { status: 500 },
    );
  }
}
