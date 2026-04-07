import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
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
    <Button
      color={armed ? "primary-destructive" : "secondary-destructive"}
      size="sm"
      iconLeading={Trash01}
      onClick={handleClick}
      isDisabled={cancelMutation.isPending}
      isLoading={cancelMutation.isPending}
      showTextWhileLoading
    >
      {cancelMutation.isPending
        ? "Cancelling..."
        : armed
          ? "Click again to cancel"
          : "Cancel Shipment"}
    </Button>
  );
}
