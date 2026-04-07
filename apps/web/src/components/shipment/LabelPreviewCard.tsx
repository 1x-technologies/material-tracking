import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/base/badges/badges";
import { pieceFraction, truncateDescription } from "../../lib/labelFormatters";

export interface LabelData {
  qrCode: string;
  shipmentNumber: string;
  pieceNumber: number;
  pieceCount: number;
  senderName: string;
  receiverName: string;
  originName: string;
  destinationName: string;
  priority: string;
  category: string;
  description: string;
}

export interface LabelPreviewCardProps {
  label: LabelData;
}

const priorityBadgeColor: Record<string, "error" | "blue" | "gray"> = {
  urgent: "error",
  standard: "blue",
  low: "gray",
};

export function LabelPreviewCard({ label }: LabelPreviewCardProps) {
  const badgeColor = priorityBadgeColor[label.priority] ?? "gray";

  return (
    <div className="aspect-[4/3] rounded-lg border border-secondary bg-primary p-4 flex gap-4 shadow-xs">
      <div className="flex items-center justify-center shrink-0 w-[40%]">
        <QRCodeSVG
          value={label.qrCode}
          level="H"
          size={120}
          marginSize={2}
        />
      </div>

      <div className="flex flex-col justify-between min-w-0 w-[60%] py-1">
        <div>
          <p className="text-base font-bold leading-tight truncate text-primary">
            {label.shipmentNumber}
          </p>
          <p className="text-lg font-semibold text-secondary">
            {pieceFraction(label.pieceNumber, label.pieceCount)}
          </p>
        </div>

        <div className="space-y-0.5 text-sm text-tertiary">
          <p className="truncate">From: {label.senderName}</p>
          <p className="truncate">To: {label.receiverName}</p>
          <p className="truncate">
            {label.originName} → {label.destinationName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge size="sm" color={badgeColor}>
            {label.priority}
          </Badge>
          <span className="text-xs text-tertiary">{label.category}</span>
        </div>

        <p className="text-xs text-quaternary truncate">
          {truncateDescription(label.description)}
        </p>
      </div>
    </div>
  );
}
