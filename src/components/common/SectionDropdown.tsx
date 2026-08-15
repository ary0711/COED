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
        mb-5
        overflow-hidden
        rounded-2xl
        border
        transition-all
        duration-300
        ${
          open
            ? "border-blue-500 shadow-lg shadow-blue-100"
            : "border-gray-200 shadow-sm hover:shadow-md"
        }
      `}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          w-full
          flex
          items-center
          justify-between
          px-6
          py-5
          transition-colors
          duration-300
          ${
            open
              ? "bg-blue-50"
              : "bg-white hover:bg-gray-50"
          }
        `}
      >
        <div className="flex items-center gap-4">
          {/* Blue Circle */}
          <div
            className={`
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              transition-all
              duration-300
              ${
                open
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }
            `}
          >
            {title.charAt(0)}
          </div>

          <div className="text-left">
            <h3
              className={`
                font-semibold
                text-lg
                transition-colors
                ${
                  open
                    ? "text-blue-700"
                    : "text-gray-800"
                }
              `}
            >
              {title}
            </h3>

            <p className="text-sm text-gray-500">
              Click to {open ? "collapse" : "edit"} this section
            </p>
          </div>
        </div>

        <ChevronDown
          size={22}
          className={`
            transition-transform
            duration-300
            ${
              open ? "rotate-180 text-blue-600" : "rotate-0 text-gray-500"
            }
          `}
        />
      </button>

      {/* Content */}
      <div
        className={`
          transition-all
          duration-300
          ease-in-out
          overflow-hidden
          ${
            open
              ? "max-h-[5000px] opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
      >
        <div className="border-t bg-gray-50 px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}