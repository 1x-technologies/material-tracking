import { useRef, useState } from "react";
import { useParams } from "react-router";
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle, AlertCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { trpc } from "../trpc";

type PageState = "ready" | "submitting" | "success" | "error";

export function SignPiecePage() {
  const { token } = useParams<{ token: string }>();
  const sigRef = useRef<SignatureCanvas>(null);
  const [state, setState] = useState<PageState>("ready");
  const [errorMessage, setErrorMessage] = useState("");

  const submitMutation = trpc.scan.submitSignatureByToken.useMutation({
    onSuccess: () => setState("success"),
    onError: (err) => {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
      setState("error");
    },
  });

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleSubmit = () => {
    if (!sigRef.current || sigRef.current.isEmpty() || !token) return;

    const signatureData = sigRef.current.toDataURL("image/png");
    setState("submitting");
    submitMutation.mutate({ token, signatureData });
  };

  if (state === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary p-4">
        <div className="w-full max-w-md rounded-xl bg-primary p-8 shadow-lg text-center">
          <EmptyState size="sm">
            <EmptyState.Header pattern="none">
              <EmptyState.FeaturedIcon icon={CheckCircle} color="success" theme="light" />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>Signature Submitted</EmptyState.Title>
              <EmptyState.Description>Thank you! You may close this page.</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary p-4">
        <div className="w-full max-w-md rounded-xl bg-primary p-8 shadow-lg text-center">
          <EmptyState size="sm">
            <EmptyState.Header pattern="none">
              <EmptyState.FeaturedIcon icon={AlertCircle} color="error" theme="light" />
            </EmptyState.Header>
            <EmptyState.Content>
              <EmptyState.Title>Unable to Submit</EmptyState.Title>
              <EmptyState.Description>{errorMessage}</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md rounded-xl bg-primary p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-primary text-center">
          Material Tracking
        </h1>
        <p className="mt-1 text-sm text-tertiary text-center mb-6">
          Sign for Delivery
        </p>

        <div className="rounded-lg border-2 border-dashed border-secondary bg-secondary">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{
              className: "w-full",
              style: { width: "100%", height: 200 },
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            size="md"
            color="secondary"
            onClick={handleClear}
            isDisabled={state === "submitting"}
            className="flex-1"
          >
            Clear
          </Button>
          <Button
            size="md"
            color="primary"
            onClick={handleSubmit}
            isDisabled={state === "submitting"}
            isLoading={state === "submitting"}
            showTextWhileLoading
            className="flex-1"
          >
            {state === "submitting" ? "Submitting..." : "Submit Signature"}
          </Button>
        </div>
      </div>
    </div>
  );
}
