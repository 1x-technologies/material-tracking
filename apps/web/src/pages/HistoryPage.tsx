import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { SearchSm, FilterFunnel01, PackageSearch } from "@untitledui/icons";
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
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "created", label: "Created" },
  { value: "in_transit", label: "In Transit" },
  { value: "partially_delivered", label: "Partially Delivered" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
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
    <div className="py-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-display-xs font-semibold text-primary">History</h1>
        <p className="text-sm text-tertiary mt-1">
          Search and browse all shipments
        </p>
      </div>

      {/* Filter Panel */}
      <div className="rounded-xl border border-secondary bg-primary p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <FilterFunnel01 className="size-4 text-quaternary" />
          <h2 className="text-sm font-semibold text-secondary">Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Date From */}
          <div>
            <label htmlFor="history-date-from" className="block text-sm font-medium text-secondary mb-1.5">
              Date From
            </label>
            <input
              id="history-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden transition duration-100 ease-linear focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="history-date-to" className="block text-sm font-medium text-secondary mb-1.5">
              Date To
            </label>
            <input
              id="history-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary shadow-xs ring-1 ring-primary ring-inset outline-hidden transition duration-100 ease-linear focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>

          {/* Status */}
          <NativeSelect
            label="Status"
            size="sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as ShipmentStatus | "")}
            options={ALL_STATUSES}
          />

          {/* Sender */}
          <Input
            label="Sender"
            size="sm"
            placeholder="Name or email"
            icon={SearchSm}
            value={senderFilter}
            onChange={(v) => setSenderFilter(v)}
          />

          {/* Receiver */}
          <Input
            label="Receiver"
            size="sm"
            placeholder="Name, email, or company"
            icon={SearchSm}
            value={receiverFilter}
            onChange={(v) => setReceiverFilter(v)}
          />

          {/* Keyword */}
          <Input
            label="Description Keyword"
            size="sm"
            placeholder="Search description"
            icon={SearchSm}
            value={keywordFilter}
            onChange={(v) => setKeywordFilter(v)}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-5 pt-4 border-t border-secondary">
          <Button
            size="md"
            color="primary"
            onClick={handleApplyFilters}
            className="min-h-[44px]"
          >
            Apply Filters
          </Button>
          <Button
            size="md"
            color="secondary"
            onClick={handleClearFilters}
            className="min-h-[44px]"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-utility-red-50 border border-utility-red-200 px-4 py-3 text-sm text-utility-red-700">
          <strong>Error:</strong> {error.message}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results count */}
          <p className="text-xs text-quaternary">
            {sortedItems.length} result{sortedItems.length !== 1 ? "s" : ""}
            {allItems.length !== sortedItems.length && ` (${allItems.length} loaded, ${sortedItems.length} matching filters)`}
          </p>

          {sortedItems.length === 0 && !isLoading ? (
            <EmptyState className="py-16">
              <EmptyState.Header pattern="none">
                <EmptyState.FeaturedIcon icon={PackageSearch} color="gray" theme="modern" />
              </EmptyState.Header>
              <EmptyState.Content>
                <EmptyState.Title>No results found</EmptyState.Title>
                <EmptyState.Description>
                  Try adjusting your filters or search criteria to find what you are looking for.
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState>
          ) : (
            <ShipmentTable
              shipments={sortedItems}
              exceptionsMap={emptyExceptionsMap}
              onRowClick={handleRowClick}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}

          {/* Load More button -- visible when more pages available */}
          {hasNextPage && (
            <Button
              size="md"
              color="secondary"
              className="w-full"
              onClick={() => fetchNextPage()}
              isDisabled={isFetchingNextPage}
              isLoading={isFetchingNextPage}
              showTextWhileLoading
            >
              {isFetchingNextPage ? "Loading..." : "Load More"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
