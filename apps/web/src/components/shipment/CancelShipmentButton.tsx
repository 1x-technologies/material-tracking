import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "../../trpc";

interface CancelShipmentButtonProps {
  shipmentId: string;
}

export function CancelShipmentButton({ shipmentId }: CancelShipmentButtonProps) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const cancelMutation = trpc.shipment.cancel.useMutation({
    onSuccess: () => navigate("/dashboard"),
  });

  const disarm = useCallback(() => setArmed(false), []);

  useEffect(() => {
    if (armed) {
      timerRef.current = setTimeout(disarm, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [armed, disarm]);

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    cancelMutation.mutate({ shipmentId });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={cancelMutation.isPending}
      className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        armed
          ? "bg-red-600 text-white hover:bg-red-700"
          : "border border-red-300 text-red-600 hover:bg-red-50"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {cancelMutation.isPending
        ? "Cancelling…"
        : armed
          ? "Click again to cancel"
          : "Cancel Shipment"}
    </button>
  );
}
