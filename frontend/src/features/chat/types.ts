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

export type ChatAnswer = {
  message: string;
  dataPoints: ChatDataPoint[];
  sources: string[];
};
