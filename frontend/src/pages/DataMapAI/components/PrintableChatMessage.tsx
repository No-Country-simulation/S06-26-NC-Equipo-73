import { Fragment } from "react";
import type { ChatMessage } from "../../../features/chat/types";

type PrintableChatMessageProps = {
  message: ChatMessage | null;
  generatedAt: string;
};

export function PrintableChatMessage({
  message,
  generatedAt,
}: PrintableChatMessageProps) {
  if (!message) {
    return null;
  }

  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <Fragment key={`print-line-${lineIndex}`}>
          {parts.map((part, partIndex) => {
            const isBold = part.startsWith("**") && part.endsWith("**") && part.length > 4;

            if (isBold) {
              return (
                <strong key={`print-part-${lineIndex}-${partIndex}`} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }

            return <Fragment key={`print-part-${lineIndex}-${partIndex}`}>{part}</Fragment>;
          })}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </Fragment>
      );
    });
  };

  return (
    <article className="min-h-full bg-white px-10 py-12 text-black">
      <header className="border-b border-slate-300 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Asistente IA
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Respuesta del asistente
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Generado el {generatedAt}
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Respuesta</h2>
        <div className="mt-3 text-sm leading-7 text-slate-800">
          {renderFormattedContent(message.content)}
        </div>
      </section>

      {message.dataPoints && message.dataPoints.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Datos relacionados</h2>
          <ul className="mt-3 space-y-3">
            {message.dataPoints.map((point) => (
              <li
                key={`${message.id}-${point.region}-${point.source}`}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800"
              >
                {point.region}: {point.value} ({point.source})
              </li>
            ))}
          </ul>
        </section>
      )}

      {message.sources && message.sources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Fuentes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-800">
            {message.sources.map((source) => (
              <li key={`${message.id}-${source}`}>{source}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
