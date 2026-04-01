import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CancelShipmentButton } from "../components/shipment/CancelShipmentButton";
import {
  DirectoryAutocomplete,
  type DirectoryPerson,
} from "../components/shipment/DirectoryAutocomplete";
import { LocationSelect } from "../components/shipment/LocationSelect";
import { PieceCountStepper } from "../components/shipment/PieceCountStepper";
import { PriorityField } from "../components/shipment/PriorityField";
import { useAuthContext } from "../context/AuthContext";
import { trpc } from "../trpc";

type ShipmentCategory = "documents" | "parts" | "samples" | "equipment" | "personal" | "other";
type Priority = "urgent" | "standard" | "low";

const CATEGORIES: { value: ShipmentCategory; label: string }[] = [
  { value: "documents", label: "Documents" },
  { value: "parts", label: "Parts" },
  { value: "samples", label: "Samples" },
  { value: "equipment", label: "Equipment" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

export function ShipmentFormPage() {
  const { shipmentId } = useParams<{ shipmentId?: string }>();
  const mode = shipmentId ? "edit" : "create";
  const { user, appUser } = useAuthContext();
  const navigate = useNavigate();

  const locationsQuery = trpc.locations.list.useQuery();

  const defaultOriginId = useMemo(() => {
    if (!appUser?.locationId || !locationsQuery.data) return "";
    const match = locationsQuery.data.find((loc) => loc.id === appUser.locationId);
    return match ? match.id : "";
  }, [appUser?.locationId, locationsQuery.data]);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ShipmentCategory>("documents");
  const [priority, setPriority] = useState<Priority>("standard");
  const [pieceCount, setPieceCount] = useState(1);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [originInitialized, setOriginInitialized] = useState(false);

  const [sender, setSender] = useState<DirectoryPerson | null>(() => {
    if (!user || !appUser) return null;
    return {
      uid: user.uid,
      name: appUser.displayName,
      email: appUser.email,
      isExternal: false,
    };
  });
  const [receiver, setReceiver] = useState<DirectoryPerson | null>(null);

  if (!originInitialized && defaultOriginId) {
    setOriginId(defaultOriginId);
    setOriginInitialized(true);
  }

  const shipmentQuery = trpc.shipment.getById.useQuery(
    { shipmentId: shipmentId! },
    { enabled: mode === "edit" && !!shipmentId },
  );

  const [editInitialized, setEditInitialized] = useState(false);
  if (mode === "edit" && shipmentQuery.data && !editInitialized) {
    const s = shipmentQuery.data as Record<string, unknown>;
    setDescription((s.description as string) ?? "");
    setCategory((s.category as ShipmentCategory) ?? "documents");
    setPriority((s.priority as Priority) ?? "standard");
    setPieceCount((s.pieceCount as number) ?? 1);

    const origin = s.origin as { locationId: string } | undefined;
    const dest = s.destination as { locationId: string } | undefined;
    setOriginId(origin?.locationId ?? "");
    setDestinationId(dest?.locationId ?? "");

    const senderData = s.sender as { uid?: string; name?: string; email?: string } | undefined;
    if (senderData) {
      setSender({
        uid: senderData.uid,
        name: senderData.name ?? "",
        email: senderData.email ?? "",
        isExternal: false,
      });
    }

    const receiverData = s.receiver as Record<string, unknown> | undefined;
    if (receiverData) {
      const isExt = receiverData.isExternal as boolean;
      setReceiver({
        uid: isExt ? undefined : (receiverData.uid as string),
        name: (receiverData.name as string) ?? "",
        email: (receiverData.email as string) ?? "",
        department: (receiverData.department as string) ?? undefined,
        company: isExt ? (receiverData.company as string) : undefined,
        isExternal: isExt,
      });
    }

    setEditInitialized(true);
  }

  const shipmentStatus = mode === "edit" ? ((shipmentQuery.data as Record<string, unknown>)?.status as string) : null;
  const isReadOnly = mode === "edit" && !!shipmentStatus && shipmentStatus !== "created";

  const createMutation = trpc.shipment.create.useMutation({
    onSuccess: (data) => navigate(`/shipments/${data.shipmentId}/edit`),
  });

  const updateMutation = trpc.shipment.update.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sender || !receiver || !originId || !destinationId || !description.trim()) return;

    const senderPayload = {
      uid: sender.uid ?? "",
      name: sender.name,
      email: sender.email,
      department: sender.department,
    };

    const receiverPayload = receiver.isExternal
      ? {
          isExternal: true as const,
          name: receiver.name,
          company: receiver.company ?? "",
          email: receiver.email,
          department: receiver.department,
        }
      : {
          isExternal: false as const,
          uid: receiver.uid ?? "",
          name: receiver.name,
          email: receiver.email,
          department: receiver.department,
        };

    if (mode === "create") {
      createMutation.mutate({
        description: description.trim(),
        category,
        priority,
        sender: senderPayload,
        receiver: receiverPayload,
        originId,
        destinationId,
        pieceCount,
      });
    } else if (shipmentId) {
      updateMutation.mutate({
        shipmentId,
        patch: {
          description: description.trim(),
          category,
          priority,
          sender: senderPayload,
          receiver: receiverPayload,
          originId,
          destinationId,
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && shipmentQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-neutral-500">Loading shipment…</p>
      </div>
    );
  }

  if (mode === "edit" && shipmentQuery.isError) {
    return (
      <div className="py-8">
        <p className="text-sm text-red-600">
          Failed to load shipment: {shipmentQuery.error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">
          {mode === "create" ? "New Shipment" : "Edit Shipment"}
        </h2>
        {mode === "edit" && shipmentQuery.data && (
          <p className="mt-1 text-sm text-neutral-500">
            {(shipmentQuery.data as Record<string, unknown>).shipmentNumber as string}
          </p>
        )}
      </div>

      {isReadOnly && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            This shipment can no longer be edited.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={500}
            rows={3}
            disabled={isReadOnly}
            placeholder="What are you shipping?"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-400"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ShipmentCategory)}
            disabled={isReadOnly}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-400"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <PriorityField value={priority} onChange={setPriority} disabled={isReadOnly} />

        {mode === "create" && (
          <PieceCountStepper value={pieceCount} onChange={setPieceCount} disabled={isReadOnly} />
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <LocationSelect label="Origin" value={originId} onChange={setOriginId} disabled={isReadOnly} />
          <LocationSelect label="Destination" value={destinationId} onChange={setDestinationId} disabled={isReadOnly} />
        </div>

        <DirectoryAutocomplete label="Sender" value={sender} onChange={setSender} disabled={isReadOnly} />
        <DirectoryAutocomplete label="Receiver" value={receiver} onChange={setReceiver} disabled={isReadOnly} />

        {!isReadOnly && (
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-200">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {isPending
                ? mode === "create" ? "Creating…" : "Saving…"
                : mode === "create" ? "Create Shipment" : "Save Changes"}
            </button>

            {mode === "edit" && shipmentId && shipmentStatus === "created" && (
              <CancelShipmentButton shipmentId={shipmentId} />
            )}
          </div>
        )}

        {createMutation.isError && (
          <p className="text-sm text-red-600">Error: {createMutation.error.message}</p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-red-600">Error: {updateMutation.error.message}</p>
        )}
        {updateMutation.isSuccess && (
          <p className="text-sm text-green-600">Changes saved successfully.</p>
        )}
      </form>
    </div>
  );
}
