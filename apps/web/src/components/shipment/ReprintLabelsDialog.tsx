import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Printer } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { buildBatchZpl } from "../../lib/zebra/buildLabelZpl";
import { trpc } from "../../trpc";
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

export function ReprintLabelsDialog({
  open,
  onClose,
  labels,
}: ReprintLabelsDialogProps) {
  const [selections, setSelections] = useState<Map<string, PieceSelection>>(
    new Map(),
  );
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [printError, setPrintError] = useState<string>("");
  const printerIp = localStorage.getItem("printer-ip") ?? "";
  const printMutation = trpc.printer.print.useMutation();

  useEffect(() => {
    if (!open) return;

    const initial = new Map<string, PieceSelection>();
    for (const label of labels) {
      initial.set(label.qrCode, { checked: true, copies: 1 });
    }
    setSelections(initial);
    setPrintState("idle");
    setPrintError("");
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

  const handleReprint = useCallback(async () => {
    if (!printerIp) return;

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
    try {
      const result = await printMutation.mutateAsync({ ip: printerIp, zpl });
      if (result.ok) {
        setPrintState("success");
        setTimeout(onClose, 800);
      } else {
        setPrintState("error");
        setPrintError(result.error);
      }
    } catch (err) {
      setPrintState("error");
      setPrintError(err instanceof Error ? err.message : "Print failed");
    }
  }, [printerIp, labels, selections, onClose, printMutation]);

  if (!open) return null;

  const canPrint = printState !== "printing" && !!printerIp && totalCopies > 0;

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

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-xl bg-primary shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">
            Reprint Labels
          </h3>
          <CloseButton onPress={onClose} size="sm" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-secondary px-6 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-secondary">
                Select pieces to reprint
              </p>
              <Button
                size="sm"
                color="link-color"
                onClick={toggleAll}
              >
                {allChecked ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="space-y-2">
              {labels.map((label) => {
                const sel = selections.get(label.qrCode);
                const checked = sel?.checked ?? false;
                const copies = sel?.copies ?? 1;

                return (
                  <div
                    key={label.qrCode}
                    className="flex items-center gap-3 rounded-lg border border-secondary px-3 py-2"
                  >
                    <Checkbox
                      isSelected={checked}
                      onChange={() => togglePiece(label.qrCode)}
                      aria-label={`Select piece ${label.pieceNumber}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-primary">
                        {pieceFraction(label.pieceNumber, label.pieceCount)}
                      </span>
                      <span className="ml-2 text-xs text-quaternary font-mono truncate">
                        {label.qrCode.slice(0, 12)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="xs"
                        color="secondary"
                        iconLeading={Minus}
                        onClick={() => setCopies(label.qrCode, copies - 1)}
                        isDisabled={!checked || copies <= 1}
                        aria-label="Decrease copies"
                      />
                      <span className="w-8 text-center text-sm tabular-nums text-primary">
                        {copies}
                      </span>
                      <Button
                        size="xs"
                        color="secondary"
                        iconLeading={Plus}
                        onClick={() => setCopies(label.qrCode, copies + 1)}
                        isDisabled={!checked || copies >= 10}
                        aria-label="Increase copies"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedLabels.length > 0 && (
            <div className="p-6">
              <p className="text-sm font-medium text-secondary mb-3">
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

        <div className="border-t border-secondary px-6 py-4 space-y-3">
          {!printerIp && (
            <div className="rounded-lg border border-error_subtle bg-error-primary px-4 py-3">
              <p className="text-sm font-medium text-error-primary">No printer configured</p>
              <p className="mt-0.5 text-sm text-error-primary">Go to Admin &gt; Printers to set up your Zebra printer IP address.</p>
            </div>
          )}

          {printerIp && (
            <p className="text-sm text-tertiary">Printing to <strong>{printerIp}</strong></p>
          )}

          {printState === "error" && printError && (
            <div className="rounded-lg border border-error_subtle bg-error-primary px-4 py-3">
              <p className="text-sm text-error-primary">{printError}</p>
            </div>
          )}

          {printState === "success" && (
            <p className="text-sm text-success-primary">
              Labels sent to printer successfully!
            </p>
          )}

          <div className="flex justify-end">
            <Button
              size="md"
              color="primary"
              iconLeading={Printer}
              onClick={handleReprint}
              isDisabled={!canPrint}
              isLoading={printState === "printing"}
              showTextWhileLoading
            >
              {printState === "printing"
                ? "Printing..."
                : `Reprint (${totalCopies} labels)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
