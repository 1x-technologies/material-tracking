import { useCallback, useEffect, useState } from "react";
import {
  type BrowserPrintError,
  type ZebraPrinter,
  discoverPrinters,
  sendZpl,
} from "../../lib/zebra/browserPrint";
import { buildBatchZpl } from "../../lib/zebra/buildLabelZpl";
import type { LabelData } from "./LabelPreviewCard";
import { LabelPreviewCard } from "./LabelPreviewCard";

export interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  labels: LabelData[];
}

type PrintState = "idle" | "printing" | "success" | "error";

type PrinterStatus =
  | { state: "loading" }
  | { state: "ready"; printers: ZebraPrinter[] }
  | { state: "error"; error: BrowserPrintError };

export function PrintLabelsDialog({
  open,
  onClose,
  labels,
}: PrintLabelsDialogProps) {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    state: "loading",
  });
  const [selectedPrinterUid, setSelectedPrinterUid] = useState<string>("");
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [printError, setPrintError] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    setPrinterStatus({ state: "loading" });
    setPrintState("idle");
    setPrintError("");
    setSelectedPrinterUid("");

    discoverPrinters().then((result) => {
      if ("error" in result) {
        setPrinterStatus({ state: "error", error: result.error });
      } else {
        setPrinterStatus({ state: "ready", printers: result.printers });
        if (result.printers.length > 0) {
          setSelectedPrinterUid(result.printers[0].uid);
        }
      }
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const selectedPrinter =
    printerStatus.state === "ready"
      ? printerStatus.printers.find((p) => p.uid === selectedPrinterUid)
      : undefined;

  const handlePrint = useCallback(async () => {
    if (!selectedPrinter) return;

    setPrintState("printing");
    setPrintError("");

    const zpl = buildBatchZpl(labels);
    const result = await sendZpl(selectedPrinter, zpl);

    if ("error" in result) {
      setPrintState("error");
      setPrintError(result.error.message);
    } else {
      setPrintState("success");
      setTimeout(onClose, 800);
    }
  }, [selectedPrinter, labels, onClose]);

  if (!open) return null;

  const canPrint =
    printState !== "printing" &&
    printerStatus.state === "ready" &&
    !!selectedPrinter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
      />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            Print Labels
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labels.map((label) => (
              <LabelPreviewCard key={label.qrCode} label={label} />
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 px-6 py-4 space-y-3">
          {printerStatus.state === "loading" && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Detecting printers…
            </div>
          )}

          {printerStatus.state === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-800">
                {printerStatus.error.message}
              </p>
              {printerStatus.error.type === "agent_unavailable" &&
                printerStatus.error.instructions && (
                  <p className="mt-1 text-sm text-red-600">
                    {printerStatus.error.instructions}
                  </p>
                )}
            </div>
          )}

          {printerStatus.state === "ready" && (
            <div className="flex items-center gap-3">
              <label
                htmlFor="printer-select"
                className="text-sm font-medium text-neutral-700 shrink-0"
              >
                Printer:
              </label>
              <select
                id="printer-select"
                value={selectedPrinterUid}
                onChange={(e) => setSelectedPrinterUid(e.target.value)}
                className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {printerStatus.printers.map((p) => (
                  <option key={p.uid} value={p.uid}>
                    {p.name} ({p.connection})
                  </option>
                ))}
              </select>
            </div>
          )}

          {printState === "error" && printError && (
            <p className="text-sm text-red-600">{printError}</p>
          )}

          {printState === "success" && (
            <p className="text-sm text-green-600">
              Labels sent to printer successfully!
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canPrint}
              className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {printState === "printing"
                ? "Printing…"
                : `Print All (${labels.length} labels)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
