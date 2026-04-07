import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "../firebase";
import type { Shipment, ShipmentStatus } from "@material-tracking/shared";

export type ShipmentWithId = Shipment & { id: string };

export interface UseShipmentsSubscriptionOptions {
  showCompleted?: boolean;
  daysBack?: number;
}

export interface UseShipmentsSubscriptionResult {
  shipments: ShipmentWithId[];
  loading: boolean;
  error: Error | null;
}

const TERMINAL_STATUSES: ShipmentStatus[] = ["completed", "cancelled"];

export function useShipmentsSubscription(
  options?: UseShipmentsSubscriptionOptions,
): UseShipmentsSubscriptionResult {
  const [shipments, setShipments] = useState<ShipmentWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const showCompleted = options?.showCompleted ?? false;
  const daysBack = options?.daysBack ?? 30;

  useEffect(() => {
    const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const q = query(
      collection(firestore, "shipments"),
      where("createdAt", ">", Timestamp.fromDate(cutoff)),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...(doc.data() as Shipment),
          id: doc.id,
        }));

        const filtered = showCompleted
          ? docs
          : docs.filter(
              (s) => !TERMINAL_STATUSES.includes(s.status),
            );

        setShipments(filtered);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [showCompleted, daysBack]);

  return { shipments, loading, error };
}
