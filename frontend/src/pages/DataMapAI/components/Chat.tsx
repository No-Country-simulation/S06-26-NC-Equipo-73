import { Search, ArrowUp, X, MessageCircle } from "lucide-react";
import { useState } from "react";

type ChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Chat = ({ isOpen, onClose }: ChatProps) => {
  const [value, setValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;

    setValue(e.target.value);
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



        <div className=" relative mt-4 flex items-center gap-2 ">
          <Search className="absolute left-2 top-3 text-text-primary" />
          <textarea
            value={value}
            className=" w-full resize-none overflow-hidden rounded-lg bg-bg-main px-12 py-3 text-text-primary text-lg  outline-none"
            rows={1}
            placeholder="Escribe aquí..."
            onChange={handleChange}
          />
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-primary p-1.5 transition-colors hover:bg-bg-main/80"
          >
            <ArrowUp className="text-primary" />
          </button>
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

