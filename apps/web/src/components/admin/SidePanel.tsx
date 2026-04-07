import { type ReactNode, useEffect } from "react";
import { CloseButton } from "@/components/base/buttons/close-button";

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

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        role="dialog"
        aria-label={title}
        className={`fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-secondary bg-primary shadow-xl transition-transform duration-200 ease-out lg:w-[400px] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-secondary px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-tertiary">{subtitle}</p>
            )}
          </div>
          <CloseButton
            onPress={onClose}
            size="sm"
            label="Close panel"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </>
  );
}
