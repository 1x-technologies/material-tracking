import { QRCodeSVG } from "qrcode.react";
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

const priorityColors: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  standard: "bg-blue-100 text-blue-700",
  low: "bg-neutral-100 text-neutral-600",
};

export function LabelPreviewCard({ label }: LabelPreviewCardProps) {
  const colorClass = priorityColors[label.priority] ?? priorityColors.low;

  return (
    <div className="aspect-[4/3] border border-neutral-300 rounded-lg bg-white p-4 flex gap-4">
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
          <p className="text-base font-bold leading-tight truncate">
            {label.shipmentNumber}
          </p>
          <p className="text-lg font-semibold text-neutral-800">
            {pieceFraction(label.pieceNumber, label.pieceCount)}
          </p>
        </div>

        <div className="space-y-0.5 text-sm text-neutral-600">
          <p className="truncate">From: {label.senderName}</p>
          <p className="truncate">To: {label.receiverName}</p>
          <p className="truncate">
            {label.originName} → {label.destinationName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
          >
            {label.priority}
          </span>
          <span className="text-xs text-neutral-500">{label.category}</span>
        </div>

        <p className="text-xs text-neutral-400 truncate">
          {truncateDescription(label.description)}
        </p>
      </div>
    </div>
  );
}
