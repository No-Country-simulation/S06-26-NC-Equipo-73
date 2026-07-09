import { useState } from "react";
import { getChatAnswer } from "../data/chatDataSource";
import type { ChatMessage, ChatQueryInput } from "../types";

type UseChatQueryResult = {
  messages: ChatMessage[];
  isLoading: boolean;
  submitQuery: (input: ChatQueryInput) => Promise<void>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible completar la consulta.";
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useChatQuery(): UseChatQueryResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const submitQuery = async (input: ChatQueryInput) => {
    const prompt = input.prompt.trim();

    if (!prompt) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: "user",
        content: prompt,
      },
    ]);
    setIsLoading(true);

    try {
      const response = await getChatAnswer({ ...input, prompt });
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.message,
          dataPoints: response.dataPoints,
        },
      ]);
    } catch (requestError) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "error",
          content: getErrorMessage(requestError),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    submitQuery,
  };
}
