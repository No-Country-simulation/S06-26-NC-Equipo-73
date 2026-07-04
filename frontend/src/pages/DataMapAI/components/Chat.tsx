import { Search, ArrowUp, X, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useChatQuery } from "../../../features/chat/hooks/useChatQuery";

type ChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Chat = ({ isOpen, onClose }: ChatProps) => {
  const [value, setValue] = useState("");
  const { answer, error, isLoading, submitQuery } = useChatQuery();

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

    await submitQuery({ prompt });
  };

  return (
    <>
      <aside
        className={` fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-text-primary-light  p-4 shadow-xl transition-transform duration-300 lg:relative lg:inset-auto lg:right-auto lg:max-w-none lg:w-full lg:translate-x-0 lg:rounded-none lg:col-span-3 lg:row-span-6 lg:col-start-10 lg:row-start-1 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-bg-main">
            <MessageCircle size={20} />
            <h3 className="text-lg font-semibold">Asistente</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-bg-main transition-colors hover:bg-white/10 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>



        <div className="relative mt-4 flex items-center gap-2 text-bg-main">
          <Search className="absolute left-2 top-3 text-bg-main" />
          <textarea
            value={value}
            className="w-full resize-none overflow-hidden rounded-lg bg-text-primary px-12 py-3 text-lg text-white outline-none"
            rows={1}
            placeholder="Escribe aquí..."
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!value.trim() || isLoading}
            className="absolute right-2 top-2 rounded-full bg-bg-main p-1.5 transition-colors hover:bg-bg-main/80"
          >
            <ArrowUp className="text-text-primary" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-bg-main">
          {isLoading && <p>Consultando al backend...</p>}

          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-red-100">
              {error}
            </p>
          )}

          {answer && (
            <div className="space-y-3 rounded-xl bg-text-primary/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6">
                {answer.message}
              </p>

              {answer.dataPoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bg-main/70">
                    Datos relacionados
                  </p>
                  <ul className="space-y-2 text-xs">
                    {answer.dataPoints.slice(0, 3).map((point) => (
                      <li
                        key={`${point.region}-${point.source}`}
                        className="rounded-lg bg-white/8 px-3 py-2"
                      >
                        {point.region}: {point.value} ({point.source})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
