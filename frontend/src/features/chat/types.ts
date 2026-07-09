export type ChatQueryInput = {
  prompt: string;
  region?: string;
  indicator?: string;
  locale?: string;
};

export type ChatDataPoint = {
  region: string;
  value: number;
  source: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  dataPoints?: ChatDataPoint[];
};

export type ChatAnswer = {
  message: string;
  dataPoints: ChatDataPoint[];
  sources: string[];
};
