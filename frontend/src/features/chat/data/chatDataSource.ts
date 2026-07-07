import { DatosService } from "../../../contracts/generated";
import type { ChatAnswer, ChatQueryInput } from "../types";

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

export async function getChatAnswer(input: ChatQueryInput): Promise<ChatAnswer> {
  const response = await DatosService.queryData({
    requestBody: {
      consulta: input.prompt.trim(),
      filtros: {
        region: normalizeText(input.region),
        indicador: normalizeText(input.indicator),
      },
      idioma: input.locale?.trim() || "es",
    },
  });

  return {
    message: response.aiResponse,
    dataPoints: response.dataPoints.map((point) => ({
      region: point.region,
      value: point.value,
      source: point.source,
    })),
    sources: [...response.sources],
  };
}
