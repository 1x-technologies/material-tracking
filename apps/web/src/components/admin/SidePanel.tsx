import { type ReactNode, useEffect } from "react";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function SidePanel({ open, onClose, title, subtitle, children }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop for mobile (< lg) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label={title}
        className={`fixed top-0 right-0 z-50 h-full w-full lg:w-[400px] bg-white border-l border-neutral-200 shadow-lg transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-neutral-200">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-neutral-900 truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-neutral-500 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex items-center justify-center size-11 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors flex-shrink-0"
          >
            <span className="text-xl" aria-hidden="true">X</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 h-[calc(100%-73px)]">
          {children}
        </div>
      </div>
    </>
  );
}
