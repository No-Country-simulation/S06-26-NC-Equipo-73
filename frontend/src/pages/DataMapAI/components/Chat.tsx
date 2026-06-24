import { Search, ArrowUp } from "lucide-react";
import { useState } from "react";
export const Chat = () => {
    const [value, setValue] = useState("");
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length > 0) {
        }
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;

        setValue(e.target.value);
    };
    // const handleClick = () => {
      
    //   if (value.length > 0) {
    //         setValue("");
    //     }
    // };
    return (
        <aside className=" col-span-3 row-span-6 col-start-10 row-start-1 bg-text-primary/75 p-4 ">
            <div className="flex items-center gap-2  text-bg-main  relative">
                <Search className="absolute left-2 top-3  text-bg-main" />
                <textarea
                    value={value}
                    className="w-full py-3 px-12 text-lg  resize-none overflow-hidden outline-none bg-text-primary rounded-lg"
                    rows={1}
                    onChange={handleChange}
                />
                <button className="absolute bg-bg-main p-1.5 rounded-full right-2 top-2 hover:bg-bg-main/80 transition-colors cursor-pointer">
                    <ArrowUp className="text-text-primary" />
                </button>
            </div>
            {/* <div >

            </div> */}
        </aside>
    );
};
