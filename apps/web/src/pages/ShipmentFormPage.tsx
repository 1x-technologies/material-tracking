import { useCallback, useEffect, useMemo, useState } from "react";
import { usePiecesSubscription } from "../hooks/usePiecesSubscription";
import { useShipmentSubscription } from "../hooks/useShipmentSubscription";
import { useLocation, useNavigate, useParams } from "react-router";
import { Printer, Edit01, Link01, QrCode01, Package } from "@untitledui/icons";
import type { BadgeColors } from "@/components/base/badges/badge-types";
import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { CancelShipmentButton } from "../components/shipment/CancelShipmentButton";
import { ShipmentTimeline } from "../components/shipment/ShipmentTimeline";
import type { LabelData } from "../components/shipment/LabelPreviewCard";
import { PrintLabelsDialog } from "../components/shipment/PrintLabelsDialog";
import { ReprintLabelsDialog } from "../components/shipment/ReprintLabelsDialog";
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

const PRIORITY_BADGE_COLOR: Record<string, "error" | "gray" | "slate"> = {
  urgent: "error",
  low: "slate",
  standard: "gray",
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-sm font-medium text-tertiary mb-0.5">{label}</span>
      <span className="text-base text-primary">{value}</span>
    </div>
  );
}

const PIECE_STATUS_COLOR: Record<string, BadgeColors> = {
  created: "gray",
  in_transit: "blue",
  delivered: "success",
  completed: "purple",
};

const PIECE_STATUS_LABEL: Record<string, string> = {
  created: "Created",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

function formatTimestamp(ts: unknown): string {
  if (!ts) return "\u2014";
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    return new Date((ts as { seconds: number }).seconds * 1000).toLocaleString();
  }
  if (typeof ts === "string") return new Date(ts).toLocaleString();
  return "\u2014";
}

interface PieceCardProps {
  piece: Record<string, unknown>;
}

function PieceCard({ piece }: PieceCardProps) {
  const status = (piece.status as string) ?? "created";
  const pieceNumber = piece.pieceNumber as number;
  const qrCode = piece.qrCode as string;
  const events = (piece.events as unknown[]) ?? [];
  const lastEvent = events.length > 0 ? (events[events.length - 1] as Record<string, unknown>) : null;
  const photoUrls = (piece.photoUrls as string[]) ?? [];

  return (
    <div className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-tertiary">
            <Package className="size-4 text-tertiary" />
          </div>
          <span className="text-sm font-semibold text-primary">Piece {pieceNumber}</span>
        </div>
        <Badge type="pill-color" size="sm" color={PIECE_STATUS_COLOR[status] ?? "gray"}>
          {PIECE_STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-tertiary">
          <QrCode01 className="size-3.5 shrink-0" />
          <span className="font-mono text-xs truncate">{qrCode}</span>
        </div>

        {lastEvent && (
          <div className="text-xs text-tertiary">
            Last: {(lastEvent.action as string)?.replace(/_/g, " ")} by{" "}
            <span className="font-medium text-secondary">{lastEvent.userName as string}</span>
            {" \u2192 "}
            {formatTimestamp(lastEvent.timestamp)}
          </div>
        )}

        {!lastEvent && (
          <div className="text-xs text-tertiary">No scan events yet</div>
        )}

        {/* Photos */}
        {photoUrls.length > 0 && (
          <div className="pt-2 border-t border-secondary mt-2">
            <p className="text-xs font-medium text-tertiary mb-1">{photoUrls.length} photo{photoUrls.length > 1 ? "s" : ""}</p>
            <div className="flex gap-2 overflow-x-auto">
              {photoUrls.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Photo ${i + 1} for piece ${pieceNumber}`}
                    className="size-16 rounded-md object-cover border border-secondary"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ShipmentFormPage() {
  const { shipmentId } = useParams<{ shipmentId?: string }>();
  const mode = shipmentId ? "edit" : "create";
  const { user, appUser } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditRoute = location.pathname.endsWith("/edit");
  const pageTitle =
    mode === "create"
      ? "New Shipment"
      : isEditRoute
        ? "Edit Shipment"
        : "Shipment Details";

  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showReprintDialog, setShowReprintDialog] = useState(false);
  const [sigLinkCopied, setSigLinkCopied] = useState(false);

  const signatureLinkMutation = trpc.scan.requestSignatureLink.useMutation();

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

  // Real-time subscriptions for instant updates on detail view
  const { shipment: liveShipment } = useShipmentSubscription(mode === "edit" ? shipmentId : undefined);
  const { pieces: livePieces } = usePiecesSubscription(shipmentId);

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

  const piecesQuery = trpc.shipment.listPieces.useQuery(
    { shipmentId: shipmentId! },
    { enabled: !!shipmentId },
  );

  const labels: LabelData[] = useMemo(() => {
    if (!shipmentQuery.data || !piecesQuery.data) return [];
    const s = shipmentQuery.data as Record<string, unknown>;
    const senderObj = s.sender as { name: string };
    const receiverObj = s.receiver as { name: string };
    const originObj = s.origin as { name: string };
    const destinationObj = s.destination as { name: string };
    const pieceCount = s.pieceCount as number;

    return piecesQuery.data.map((piece: Record<string, unknown>) => ({
      qrCode: piece.qrCode as string,
      shipmentNumber: s.shipmentNumber as string,
      pieceNumber: piece.pieceNumber as number,
      pieceCount,
      senderName: senderObj.name,
      receiverName: receiverObj.name,
      originName: originObj.name,
      destinationName: destinationObj.name,
      priority: s.priority as string,
      category: s.category as string,
      description: s.description as string,
    }));
  }, [shipmentQuery.data, piecesQuery.data]);

  // Shipment-level signature: moved below shipmentStatus declaration

  const handleSendSignatureLink = useCallback(async () => {
    if (!shipmentId) return;
    try {
      const result = await signatureLinkMutation.mutateAsync({ shipmentId });
      const fullUrl = `${window.location.origin}${result.url}`;
      await navigator.clipboard.writeText(fullUrl);
      setSigLinkCopied(true);
      setTimeout(() => setSigLinkCopied(false), 3000);
    } catch {
      // mutation error handled by tRPC
    }
  }, [shipmentId, signatureLinkMutation]);

  const shipmentStatus = mode === "edit"
    ? ((liveShipment?.status as string) ?? (shipmentQuery.data as Record<string, unknown>)?.status as string) ?? null
    : null;
  const isReadOnly = mode === "edit" && (!isEditRoute || (!!shipmentStatus && shipmentStatus !== "created"));

  // Shipment-level signature
  const shipmentDataForSig = (liveShipment ?? shipmentQuery.data) as Record<string, unknown> | null;
  const shipmentSignatureUrl = (shipmentDataForSig?.signatureUrl as string) ?? null;
  const needsSignature = shipmentStatus === "delivered" || shipmentStatus === "completed";

  const createMutation = trpc.shipment.create.useMutation({
    onSuccess: (data) => navigate(`/shipments/${data.shipmentId}`),
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
        <p className="text-sm text-tertiary">Loading shipment...</p>
      </div>
    );
  }

  if (mode === "edit" && shipmentQuery.isError) {
    return (
      <div className="py-8">
        <p className="text-sm text-error-primary">
          Failed to load shipment: {shipmentQuery.error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-0 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">
          {pageTitle}
        </h2>
        {mode === "edit" && shipmentQuery.data && (
          <p className="mt-1 text-sm text-tertiary">
            {(shipmentQuery.data as Record<string, unknown>).shipmentNumber as string}
          </p>
        )}
      </div>

      {isReadOnly && !!shipmentStatus && shipmentStatus !== "created" && (
        <div className="mb-6 rounded-lg border border-warning bg-warning-primary px-4 py-3">
          <p className="text-sm font-medium text-warning-primary">
            This shipment can no longer be edited.
          </p>
        </div>
      )}

      {shipmentId && shipmentStatus !== "cancelled" && piecesQuery.data && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            color="primary"
            iconLeading={Printer}
            onClick={() => setShowPrintDialog(true)}
          >
            Print Labels
          </Button>
          <Button
            size="sm"
            color="secondary"
            iconLeading={Printer}
            onClick={() => setShowReprintDialog(true)}
          >
            Reprint Labels
          </Button>
          {isReadOnly && shipmentStatus === "created" && (
            <Button
              size="sm"
              color="secondary"
              iconLeading={Edit01}
              onClick={() => navigate(`/shipments/${shipmentId}/edit`)}
            >
              Edit Shipment
            </Button>
          )}
          {appUser?.role === "admin" && needsSignature && !shipmentSignatureUrl && (
            <Button
              size="sm"
              color="secondary"
              iconLeading={Link01}
              onClick={handleSendSignatureLink}
              isDisabled={signatureLinkMutation.isPending}
              isLoading={signatureLinkMutation.isPending}
              showTextWhileLoading
            >
              {sigLinkCopied
                ? "Link Copied!"
                : signatureLinkMutation.isPending
                  ? "Generating..."
                  : "Send Signature Link"}
            </Button>
          )}
        </div>
      )}

      {isReadOnly && mode === "edit" ? (
        <div className="flex gap-8 items-start">
          {/* Left column: shipment details + signature + pieces */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <DetailField label="Description" value={description} />
              <DetailField label="Category" value={CATEGORIES.find((c) => c.value === category)?.label ?? category} />
              <div>
                <span className="block text-sm font-medium text-tertiary mb-0.5">Priority</span>
                <Badge
                  size="md"
                  color={PRIORITY_BADGE_COLOR[priority] ?? "gray"}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Badge>
              </div>
              <DetailField label="Pieces" value={String(pieceCount)} />
              <DetailField label="Origin" value={locationsQuery.data?.find((l) => l.id === originId)?.name ? `${locationsQuery.data.find((l) => l.id === originId)!.name} - ${locationsQuery.data.find((l) => l.id === originId)!.fullName}` : originId} />
              <DetailField label="Destination" value={locationsQuery.data?.find((l) => l.id === destinationId)?.name ? `${locationsQuery.data.find((l) => l.id === destinationId)!.name} - ${locationsQuery.data.find((l) => l.id === destinationId)!.fullName}` : destinationId} />
              <DetailField label="Sender" value={sender ? `${sender.name} (${sender.email})` : "\u2014"} />
              <DetailField label="Receiver" value={receiver ? `${receiver.name}${receiver.company ? `, ${receiver.company}` : ""} (${receiver.email})` : "\u2014"} />
            </div>

            {shipmentSignatureUrl && (
              <div className="mt-8 max-w-sm">
                <h3 className="text-lg font-semibold text-primary mb-3">Delivery Signature</h3>
                <div className="rounded-xl border border-secondary bg-primary p-4 shadow-xs">
                  <img
                    src={shipmentSignatureUrl}
                    alt="Delivery signature"
                    className="w-full h-auto max-h-32 object-contain rounded-lg border border-secondary bg-primary"
                  />
                </div>
              </div>
            )}

            {(livePieces ?? piecesQuery.data) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Pieces ({(livePieces ?? piecesQuery.data)!.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(livePieces ?? piecesQuery.data)!.map((p: Record<string, unknown>, i: number) => (
                    <PieceCard key={(p.id as string) ?? i} piece={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Mobile/tablet: activity timeline below pieces */}
            {(livePieces ?? piecesQuery.data) && (liveShipment ?? shipmentQuery.data) && (
              <div className="lg:hidden mt-8">
                <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
                  <h3 className="text-sm font-semibold text-primary mb-4">Activity</h3>
                  <ShipmentTimeline
                    createdBy={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).createdBy as { uid: string; name: string }}
                    createdAt={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).createdAt}
                    status={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).status as string}
                    updatedAt={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).updatedAt}
                    pieces={(livePieces ?? piecesQuery.data)!.map((p: Record<string, unknown>) => ({
                      pieceNumber: p.pieceNumber as number,
                      events: ((p.events as unknown[]) ?? []).map((e) => {
                        const ev = e as Record<string, unknown>;
                        return {
                          action: ev.action as string,
                          timestamp: ev.timestamp,
                          userId: (ev.userId as string) ?? "",
                          userName: (ev.userName as string) ?? "",
                          signatureUrl: (ev.signatureUrl as string) ?? undefined,
                          photoUrls: (ev.photoUrls as string[]) ?? undefined,
                        };
                      }),
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right column: Activity timeline (sticky, desktop only) */}
          {(livePieces ?? piecesQuery.data) && (liveShipment ?? shipmentQuery.data) && (
            <div className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-4">
              <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs max-h-[calc(100vh-6rem)] overflow-y-auto">
                <h3 className="text-sm font-semibold text-primary mb-4">Activity</h3>
                <ShipmentTimeline
                  createdBy={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).createdBy as { uid: string; name: string }}
                  createdAt={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).createdAt}
                  status={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).status as string}
                  updatedAt={((liveShipment ?? shipmentQuery.data) as Record<string, unknown>).updatedAt}
                  pieces={(livePieces ?? piecesQuery.data)!.map((p: Record<string, unknown>) => ({
                    pieceNumber: p.pieceNumber as number,
                    events: ((p.events as unknown[]) ?? []).map((e) => {
                      const ev = e as Record<string, unknown>;
                      return {
                        action: ev.action as string,
                        timestamp: ev.timestamp,
                        userId: (ev.userId as string) ?? "",
                        userName: (ev.userName as string) ?? "",
                        signatureUrl: (ev.signatureUrl as string) ?? undefined,
                        photoUrls: (ev.photoUrls as string[]) ?? undefined,
                      };
                    }),
                  }))}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <TextArea
          label="Description"
          isRequired
          value={description}
          onChange={(v) => setDescription(v)}
          placeholder="What are you shipping?"
          rows={3}
          size="sm"
        />

        <NativeSelect
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ShipmentCategory)}
          options={CATEGORIES.map((c) => ({ label: c.label, value: c.value }))}
          size="sm"
        />

        <PriorityField value={priority} onChange={setPriority} />

        {mode === "create" && (
          <PieceCountStepper value={pieceCount} onChange={setPieceCount} />
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <LocationSelect label="Origin" value={originId} onChange={setOriginId} />
          <LocationSelect label="Destination" value={destinationId} onChange={setDestinationId} />
        </div>

        <DirectoryAutocomplete label="Sender" value={sender} onChange={setSender} />
        <DirectoryAutocomplete label="Receiver" value={receiver} onChange={setReceiver} />

        <div className="flex items-center gap-4 pt-4 border-t border-secondary">
          <Button
            type="submit"
            size="md"
            color="primary"
            isDisabled={isPending}
            isLoading={isPending}
            showTextWhileLoading
          >
            {isPending
              ? mode === "create" ? "Creating..." : "Saving..."
              : mode === "create" ? "Create Shipment" : "Save Changes"}
          </Button>

          {mode === "edit" && shipmentId && shipmentStatus === "created" && (
            <CancelShipmentButton shipmentId={shipmentId} />
          )}
        </div>

        {createMutation.isError && (
          <p className="text-sm text-error-primary">Error: {createMutation.error.message}</p>
        )}
        {updateMutation.isError && (
          <p className="text-sm text-error-primary">Error: {updateMutation.error.message}</p>
        )}
        {updateMutation.isSuccess && (
          <p className="text-sm text-success-primary">Changes saved successfully.</p>
        )}
      </form>
      )}

      <PrintLabelsDialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        labels={labels}
      />
      <ReprintLabelsDialog
        open={showReprintDialog}
        onClose={() => setShowReprintDialog(false)}
        labels={labels}
      />
    </div>
  );
}
