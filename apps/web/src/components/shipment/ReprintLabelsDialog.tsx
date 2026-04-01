import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type BrowserPrintError,
  type ZebraPrinter,
  discoverPrinters,
  sendZpl,
} from "../../lib/zebra/browserPrint";
import { buildBatchZpl } from "../../lib/zebra/buildLabelZpl";
import { pieceFraction } from "../../lib/labelFormatters";
import type { LabelData } from "./LabelPreviewCard";
import { LabelPreviewCard } from "./LabelPreviewCard";

export interface ReprintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  labels: LabelData[];
}

interface PieceSelection {
  checked: boolean;
  copies: number;
}

type PrintState = "idle" | "printing" | "success" | "error";

type PrinterStatus =
  | { state: "loading" }
  | { state: "ready"; printers: ZebraPrinter[] }
  | { state: "error"; error: BrowserPrintError };

export function ReprintLabelsDialog({
  open,
  onClose,
  labels,
}: ReprintLabelsDialogProps) {
  const [selections, setSelections] = useState<Map<string, PieceSelection>>(
    new Map(),
  );
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    state: "loading",
  });
  const [selectedPrinterUid, setSelectedPrinterUid] = useState<string>("");
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [printError, setPrintError] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    const initial = new Map<string, PieceSelection>();
    for (const label of labels) {
      initial.set(label.qrCode, { checked: true, copies: 1 });
    }
    setSelections(initial);
    setPrintState("idle");
    setPrintError("");
    setSelectedPrinterUid("");
    setPrinterStatus({ state: "loading" });

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
  }, [open, labels]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const togglePiece = (qrCode: string) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(qrCode);
      if (current) {
        next.set(qrCode, { ...current, checked: !current.checked });
      }
      return next;
    });
  };

  const setCopies = (qrCode: string, copies: number) => {
    const clamped = Math.max(1, Math.min(10, copies));
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(qrCode);
      if (current) {
        next.set(qrCode, { ...current, copies: clamped });
      }
      return next;
    });
  };

  const allChecked = labels.every(
    (l) => selections.get(l.qrCode)?.checked ?? false,
  );

  const toggleAll = () => {
    setSelections((prev) => {
      const next = new Map(prev);
      const newChecked = !allChecked;
      for (const label of labels) {
        const current = next.get(label.qrCode);
        if (current) {
          next.set(label.qrCode, { ...current, checked: newChecked });
        }
      }
      return next;
    });
  };

  const selectedLabels = useMemo(
    () => labels.filter((l) => selections.get(l.qrCode)?.checked),
    [labels, selections],
  );

  const totalCopies = useMemo(() => {
    let total = 0;
    for (const label of labels) {
      const sel = selections.get(label.qrCode);
      if (sel?.checked) total += sel.copies;
    }
    return total;
  }, [labels, selections]);

  const selectedPrinter =
    printerStatus.state === "ready"
      ? printerStatus.printers.find((p) => p.uid === selectedPrinterUid)
      : undefined;

  const handleReprint = useCallback(async () => {
    if (!selectedPrinter) return;

    setPrintState("printing");
    setPrintError("");

    const expandedLabels: LabelData[] = [];
    for (const label of labels) {
      const sel = selections.get(label.qrCode);
      if (sel?.checked) {
        for (let i = 0; i < sel.copies; i++) {
          expandedLabels.push(label);
        }
      }
    }

    const zpl = buildBatchZpl(expandedLabels);
    const result = await sendZpl(selectedPrinter, zpl);

    if ("error" in result) {
      setPrintState("error");
      setPrintError(result.error.message);
    } else {
      setPrintState("success");
      setTimeout(onClose, 800);
    }
  }, [selectedPrinter, labels, selections, onClose]);

  if (!open) return null;

  const canPrint =
    printState !== "printing" &&
    printerStatus.state === "ready" &&
    !!selectedPrinter &&
    totalCopies > 0;

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
            Reprint Labels
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

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-neutral-200 px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-neutral-700">
                Select pieces to reprint
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                {allChecked ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="space-y-2">
              {labels.map((label) => {
                const sel = selections.get(label.qrCode);
                const checked = sel?.checked ?? false;
                const copies = sel?.copies ?? 1;

                return (
                  <div
                    key={label.qrCode}
                    className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePiece(label.qrCode)}
                      className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-neutral-900">
                        {pieceFraction(label.pieceNumber, label.pieceCount)}
                      </span>
                      <span className="ml-2 text-xs text-neutral-400 font-mono truncate">
                        {label.qrCode.slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCopies(label.qrCode, copies - 1)}
                        disabled={!checked || copies <= 1}
                        className="h-7 w-7 rounded border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {copies}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCopies(label.qrCode, copies + 1)}
                        disabled={!checked || copies >= 10}
                        className="h-7 w-7 rounded border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedLabels.length > 0 && (
            <div className="p-6">
              <p className="text-sm font-medium text-neutral-700 mb-3">
                Preview
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLabels.map((label) => (
                  <LabelPreviewCard key={label.qrCode} label={label} />
                ))}
              </div>
            </div>
          )}
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
                htmlFor="reprint-printer-select"
                className="text-sm font-medium text-neutral-700 shrink-0"
              >
                Printer:
              </label>
              <select
                id="reprint-printer-select"
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
              onClick={handleReprint}
              disabled={!canPrint}
              className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {printState === "printing"
                ? "Printing…"
                : `Reprint (${totalCopies} labels)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
