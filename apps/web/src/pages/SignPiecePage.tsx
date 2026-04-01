import { useRef, useState } from "react";
import { useParams } from "react-router";
import SignatureCanvas from "react-signature-canvas";
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
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Signature Submitted</h1>
          <p className="mt-2 text-sm text-neutral-500">Thank you! You may close this page.</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">Unable to Submit</h1>
          <p className="mt-2 text-sm text-neutral-500">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-neutral-900 text-center">
          Material Tracking
        </h1>
        <p className="mt-1 text-sm text-neutral-500 text-center mb-6">
          Sign for Delivery
        </p>

        <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50">
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
          <button
            type="button"
            onClick={handleClear}
            disabled={state === "submitting"}
            className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors disabled:opacity-60"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state === "submitting"}
            className="flex-1 rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            {state === "submitting" ? "Submitting\u2026" : "Submit Signature"}
          </button>
        </div>
      </div>
    </div>
  );
}
