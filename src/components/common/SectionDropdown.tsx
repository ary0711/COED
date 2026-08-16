import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function SectionDropdown({
  title,
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`
        mb-6
        overflow-hidden
        rounded-2xl
        border
        bg-white
        transition-all
        duration-300
        ${
          open
            ? "border-blue-200 shadow-lg shadow-blue-900/5"
            : "border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
        }
      `}
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          group
          w-full
          flex
          items-center
          justify-between
          px-6
          py-5
          text-left
          transition-all
          duration-200
          ${
            open
              ? "bg-blue-50/60"
              : "bg-white hover:bg-gray-50/80"
          }
        `}
      >
        <div className="flex items-center gap-4">
          {/* SECTION ICON */}
          <div
            className={`
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              text-sm
              font-bold
              transition-all
              duration-300
              ${
                open
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
              }
            `}
          >
            {title.charAt(0).toUpperCase()}
          </div>

          {/* TITLE */}
          <div>
            <h3
              className={`
                text-base
                font-semibold
                tracking-tight
                transition-colors
                duration-200
                ${
                  open
                    ? "text-blue-700"
                    : "text-gray-800 group-hover:text-gray-900"
                }
              `}
            >
              {title}
            </h3>

            <p className="mt-1 text-xs font-medium text-gray-500">
              {open
                ? "Section is currently expanded"
                : "Click to edit this section"}
            </p>
          </div>
        </div>

        {/* CHEVRON */}
        <div
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            transition-all
            duration-300
            ${
              open
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
            }
          `}
        >
          <ChevronDown
            size={19}
            strokeWidth={2}
            className={`
              transition-transform
              duration-300
              ${open ? "rotate-180" : "rotate-0"}
            `}
          />
        </div>
      </button>

      {/* CONTENT */}
      <div
        className={`
          grid
          transition-all
          duration-300
          ease-in-out
          ${
            open
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }
        `}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-200 bg-gray-50/70 px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}