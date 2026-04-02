import { z } from "zod";

/**
 * Shipment search input schema for the shipment.search tRPC query.
 *
 * Supports:
 * - Optional status filter (AND with date range when both provided)
 * - Optional date range filter via dateFrom/dateTo (interpreted as UTC instants)
 * - Cursor-based pagination (50 items per page, requests 51 to detect hasMore)
 *
 * Sender/receiver/keyword filtering is handled client-side per D-03.
 *
 * Shipment documents are retained indefinitely; no server-side purge (HIST-02).
 */

const shipmentStatusEnum = z.enum([
  "created",
  "in_transit",
  "partially_delivered",
  "delivered",
  "picked_up",
  "cancelled",
]);

/**
 * Cursor for pagination. Contains the createdAt timestamp and document ID
 * of the last item from the previous page, enabling stable startAfter positioning.
 */
const searchCursorSchema = z.object({
  createdAt: z.string().datetime({ message: "cursor.createdAt must be a valid ISO 8601 datetime" }),
  id: z.string().min(1, "cursor.id is required"),
});

export const shipmentSearchInputSchema = z.object({
  /** Filter by shipment status. Omit or undefined to include all statuses. */
  status: shipmentStatusEnum.optional(),

  /**
   * Inclusive lower bound for createdAt range (UTC ISO 8601 string).
   * Interpreted as an exact instant; for day-level queries, pass "YYYY-MM-DDT00:00:00.000Z".
   */
  dateFrom: z
    .string()
    .datetime({ message: "dateFrom must be a valid ISO 8601 datetime" })
    .optional(),

  /**
   * Inclusive upper bound for createdAt range (UTC ISO 8601 string).
   * For day-level queries, pass the end of the day: "YYYY-MM-DDT23:59:59.999Z".
   */
  dateTo: z
    .string()
    .datetime({ message: "dateTo must be a valid ISO 8601 datetime" })
    .optional(),

  /** Opaque cursor from a previous response's nextCursor for fetching the next page. */
  cursor: searchCursorSchema.optional(),
});

export type ShipmentSearchInput = z.infer<typeof shipmentSearchInputSchema>;
export type SearchCursor = z.infer<typeof searchCursorSchema>;
