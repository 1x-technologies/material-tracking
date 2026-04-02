import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ShipmentStatus } from "@material-tracking/shared";
import {
  ShipmentTable,
  sortShipments,
  type SortField,
  type SortDirection,
} from "../components/dashboard/ShipmentTable";
import type { ShipmentWithId } from "../hooks/useShipmentsSubscription";
import type { ExceptionType } from "../utils/exceptions";
import { Spinner } from "../components/ui/Spinner";
import { trpc } from "../trpc";

const ALL_STATUSES: { value: ShipmentStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "created", label: "Created" },
  { value: "in_transit", label: "In Transit" },
  { value: "partially_delivered", label: "Partially Delivered" },
  { value: "delivered", label: "Delivered" },
  { value: "picked_up", label: "Picked Up" },
  { value: "cancelled", label: "Cancelled" },
];

/**
 * Client-side AND filters for sender, receiver, and keyword.
 * Per D-03/D-04: Firestore doesn't support full-text search natively,
 * so these filters are applied on the loaded result set.
 * For very large histories, a v2 search service (Algolia/Typesense) may be needed.
 */
function applyClientFilters(
  items: ShipmentWithId[],
  senderFilter: string,
  receiverFilter: string,
  keywordFilter: string,
): ShipmentWithId[] {
  const sender = senderFilter.trim().toLowerCase();
  const receiver = receiverFilter.trim().toLowerCase();
  const keyword = keywordFilter.trim().toLowerCase();

  return items.filter((item) => {
    if (sender) {
      const senderName = (item.sender.name ?? "").toLowerCase();
      const senderEmail = (item.sender.email ?? "").toLowerCase();
      if (!senderName.includes(sender) && !senderEmail.includes(sender)) {
        return false;
      }
    }

    if (receiver) {
      const receiverName = (item.receiver.name ?? "").toLowerCase();
      const receiverEmail = (item.receiver.email ?? "").toLowerCase();
      const receiverCompany = (item.receiver.company ?? "").toLowerCase();
      if (
        !receiverName.includes(receiver) &&
        !receiverEmail.includes(receiver) &&
        !receiverCompany.includes(receiver)
      ) {
        return false;
      }
    }

    if (keyword) {
      const desc = (item.description ?? "").toLowerCase();
      if (!desc.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}

export function HistoryPage() {
  const navigate = useNavigate();

  // Server-side filter state (sent with tRPC query)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState<ShipmentStatus | "">("");

  // Client-side filter state (applied on loaded data per D-03)
  const [senderFilter, setSenderFilter] = useState("");
  const [receiverFilter, setReceiverFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");

  // Applied filters (committed on Apply click to avoid query storms)
  const [appliedFilters, setAppliedFilters] = useState<{
    dateFrom?: string;
    dateTo?: string;
    status?: ShipmentStatus;
  }>({});

  // Sort state
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Build tRPC input from applied server-side filters
  const searchInput = useMemo(() => {
    const input: {
      status?: ShipmentStatus;
      dateFrom?: string;
      dateTo?: string;
      cursor?: { createdAt: string; id: string };
    } = {};

    if (appliedFilters.status) {
      input.status = appliedFilters.status;
    }
    if (appliedFilters.dateFrom) {
      input.dateFrom = new Date(`${appliedFilters.dateFrom}T00:00:00.000Z`).toISOString();
    }
    if (appliedFilters.dateTo) {
      input.dateTo = new Date(`${appliedFilters.dateTo}T23:59:59.999Z`).toISOString();
    }

    return input;
  }, [appliedFilters]);

  // Use tRPC infinite query for cursor-based pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = trpc.shipment.search.useInfiniteQuery(searchInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialCursor: undefined,
  });

  // Flatten all pages into a single array
  const allItems = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items as ShipmentWithId[]);
  }, [data]);

  // Apply client-side filters (sender, receiver, keyword) with AND logic
  const filteredItems = useMemo(
    () => applyClientFilters(allItems, senderFilter, receiverFilter, keywordFilter),
    [allItems, senderFilter, receiverFilter, keywordFilter],
  );

  // Sort filtered results
  const sortedItems = useMemo(
    () => sortShipments(filteredItems, sortField, sortDirection),
    [filteredItems, sortField, sortDirection],
  );

  // Empty exceptions map -- history page does not track live exceptions
  const emptyExceptionsMap = useMemo(() => new Map<string, ExceptionType[]>(), []);

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || undefined,
    });
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setSenderFilter("");
    setReceiverFilter("");
    setKeywordFilter("");
    setAppliedFilters({});
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleRowClick = (shipmentId: string) => {
    navigate(`/shipments/${shipmentId}`);
  };

  return (
    <div className="py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">History</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Search and browse all shipments
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Date From */}
          <div>
            <label htmlFor="history-date-from" className="block text-xs font-medium text-neutral-600 mb-1">
              Date From
            </label>
            <input
              id="history-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="history-date-to" className="block text-xs font-medium text-neutral-600 mb-1">
              Date To
            </label>
            <input
              id="history-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="history-status" className="block text-xs font-medium text-neutral-600 mb-1">
              Status
            </label>
            <select
              id="history-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ShipmentStatus | "")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sender */}
          <div>
            <label htmlFor="history-sender" className="block text-xs font-medium text-neutral-600 mb-1">
              Sender
            </label>
            <input
              id="history-sender"
              type="text"
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              placeholder="Name or email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Receiver */}
          <div>
            <label htmlFor="history-receiver" className="block text-xs font-medium text-neutral-600 mb-1">
              Receiver
            </label>
            <input
              id="history-receiver"
              type="text"
              value={receiverFilter}
              onChange={(e) => setReceiverFilter(e.target.value)}
              placeholder="Name, email, or company"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          {/* Keyword */}
          <div>
            <label htmlFor="history-keyword" className="block text-xs font-medium text-neutral-600 mb-1">
              Description Keyword
            </label>
            <input
              id="history-keyword"
              type="text"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="Search description"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleApplyFilters}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      ) : (
        <>
          {/* Results count */}
          <p className="text-xs text-neutral-400 mb-2">
            {sortedItems.length} result{sortedItems.length !== 1 ? "s" : ""}
            {allItems.length !== sortedItems.length && ` (${allItems.length} loaded, ${sortedItems.length} matching filters)`}
          </p>

          <ShipmentTable
            shipments={sortedItems}
            exceptionsMap={emptyExceptionsMap}
            onRowClick={handleRowClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Load More button -- visible when more pages available */}
          {hasNextPage && (
            <div className="flex justify-center py-6">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-lg border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
