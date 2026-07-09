import { ArrowUp, X, MessageCircle } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import type { ChatMessage } from "../../../features/chat/types";
import { useChatQuery } from "../../../features/chat/hooks/useChatQuery";

type ChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Chat = ({ isOpen, onClose }: ChatProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { messages, isLoading, submitQuery } = useChatQuery();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;

    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    const prompt = value.trim();

    if (!prompt || isLoading) {
      return;
    }

    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await submitQuery({ prompt });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);

      return (
        <Fragment key={`line-${lineIndex}`}>
          {parts.map((part, partIndex) => {
            const isBold = part.startsWith("**") && part.endsWith("**") && part.length > 4;

            if (isBold) {
              return (
                <strong key={`part-${lineIndex}-${partIndex}`} className="font-semibold text-current">
                  {part.slice(2, -2)}
                </strong>
              );
            }

            return <Fragment key={`part-${lineIndex}-${partIndex}`}>{part}</Fragment>;
          })}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </Fragment>
      );
    });
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === "user";
    const isError = message.role === "error";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-white text-bg-main"
              : isError
                ? "bg-red-500/15 text-red-100"
                : "bg-text-primary/18 text-text-primary"
          }`}
        >
          <p className="text-sm leading-6 break-words">
            {isUser ? message.content : renderFormattedMessage(message.content)}
          </p>

          {!isUser && !isError && message.dataPoints && message.dataPoints.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary/70">
                Datos relacionados
              </p>
              <ul className="space-y-2 text-xs">
                {message.dataPoints.slice(0, 3).map((point) => (
                  <li
                    key={`${message.id}-${point.region}-${point.source}`}
                    className="rounded-lg bg-white/10 px-3 py-2"
                  >
                    {point.region}: {point.value} ({point.source})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <aside
        className={` fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-bg-main/80  p-4 shadow-xl transition-transform duration-300 lg:relative lg:inset-auto lg:right-auto lg:max-w-none lg:w-full lg:translate-x-0 lg:rounded-none lg:col-span-3 lg:row-span-6 lg:col-start-10 lg:row-start-1 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-primary">
            <MessageCircle size={20} />
            <h3 className="text-lg font-semibold">Asistente</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-text-primary transition-colors hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>



        <form className="relative mt-4" onSubmit={handleFormSubmit}>
          <textarea
            ref={textareaRef}
            value={value}
            className="w-full resize-none overflow-hidden rounded-2xl border border-white/10 bg-bg-main pr-14 pl-4 py-3 text-lg text-text-primary outline-none"
            rows={1}
            placeholder="Escribe aquí..."
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            disabled={!value.trim() || isLoading}
            aria-label="Enviar mensaje"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-bg-main transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/40"
          >
            <ArrowUp size={18} />
          </button>
        </form>

        <div className="mt-4 space-y-3 overflow-y-auto pr-1 text-sm">
          {messages.length === 0 && !isLoading && (
            <p className="rounded-2xl bg-white/8 px-4 py-3 text-text-primary/75">
              Haz una pregunta para comenzar la conversación.
            </p>
          )}

          {messages.map(renderMessage)}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-text-primary/18 px-4 py-3 text-sm leading-6 text-text-primary">
                Consultando al backend...
              </div>
            </div>
          )}
        </div>
      </aside>

      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar chat"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
    </>
  );
};
