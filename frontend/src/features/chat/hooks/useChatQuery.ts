import { useState } from "react";
import { getChatAnswer } from "../data/chatDataSource";
import type { ChatAnswer, ChatQueryInput } from "../types";

type UseChatQueryResult = {
  answer: ChatAnswer | null;
  error: string | null;
  isLoading: boolean;
  submitQuery: (input: ChatQueryInput) => Promise<void>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible completar la consulta.";
}

export function useChatQuery(): UseChatQueryResult {
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submitQuery = async (input: ChatQueryInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getChatAnswer(input);
      setAnswer(response);
    } catch (requestError) {
      setAnswer(null);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    answer,
    error,
    isLoading,
    submitQuery,
  };
}
