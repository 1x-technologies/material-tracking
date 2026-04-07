import { useCallback, useEffect, useState } from "react";
import { Printer, AlertCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { buildBatchZpl } from "../../lib/zebra/buildLabelZpl";
import { trpc } from "../../trpc";
import type { LabelData } from "./LabelPreviewCard";
import { LabelPreviewCard } from "./LabelPreviewCard";

export interface PrintLabelsDialogProps {
  open: boolean;
  onClose: () => void;
  labels: LabelData[];
}

type PrintState = "idle" | "printing" | "success" | "error";

export function PrintLabelsDialog({ open, onClose, labels }: PrintLabelsDialogProps) {
  const [printState, setPrintState] = useState<PrintState>("idle");
  const [printError, setPrintError] = useState<string>("");
  const printerIp = localStorage.getItem("printer-ip") ?? "";

  const printMutation = trpc.printer.print.useMutation();

  useEffect(() => {
    if (!open) return;
    setPrintState("idle");
    setPrintError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handlePrint = useCallback(async () => {
    if (!printerIp) return;

    setPrintState("printing");
    setPrintError("");

    const zpl = buildBatchZpl(labels);

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
  }, [printerIp, labels, onClose, printMutation]);

  if (!open) return null;

  const canPrint = printState !== "printing" && !!printerIp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClose(); }}
        role="button"
        tabIndex={-1}
        aria-label="Close dialog"
      />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-xl bg-primary shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
          <h3 className="text-lg font-semibold text-primary">Print Labels</h3>
          <CloseButton onPress={onClose} size="sm" />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labels.map((label) => (
              <LabelPreviewCard key={label.qrCode} label={label} />
            ))}
          </div>
        </div>

        <div className="border-t border-secondary px-6 py-4 space-y-3">
          {!printerIp && (
            <div className="rounded-lg border border-error_subtle bg-error-primary px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="size-4 text-error-primary mt-0.5 shrink-0" />
                <div className="text-sm text-error-primary">
                  <p className="font-medium">No printer configured</p>
                  <p className="mt-0.5">Go to Admin &gt; Printers to set up your Zebra printer IP address.</p>
                </div>
              </div>
            </div>
          )}

          {printerIp && (
            <p className="text-sm text-tertiary">
              Printing to <strong>{printerIp}</strong>
            </p>
          )}

          {printState === "error" && printError && (
            <div className="rounded-lg border border-error_subtle bg-error-primary px-4 py-3">
              <p className="text-sm text-error-primary">{printError}</p>
            </div>
          )}

          {printState === "success" && (
            <p className="text-sm text-success-primary">Labels sent to printer!</p>
          )}

          <div className="flex justify-end">
            <Button
              size="md"
              color="primary"
              iconLeading={Printer}
              onClick={handlePrint}
              isDisabled={!canPrint}
              isLoading={printState === "printing"}
              showTextWhileLoading
            >
              {printState === "printing"
                ? "Printing..."
                : `Print All (${labels.length} labels)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
