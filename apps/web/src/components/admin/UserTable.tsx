import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SearchLg, Users01 } from "@untitledui/icons";
import { Spinner } from "../ui/Spinner";
import { StatusPill } from "./StatusPill";
import { UserDetailPanel } from "./UserDetailPanel";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { trpc } from "../../trpc";

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const roleBadgeColor: Record<string, "brand" | "purple" | "blue"> = {
  admin: "brand",
  driver: "purple",
  staff: "blue",
};

export function UserTable() {
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery();
  const { data: locations } = trpc.admin.listAllLocations.useQuery();
  const utils = trpc.useUtils();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bulkAssignMutation = trpc.admin.bulkAssignRole.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(`Role updated for ${variables.uids.length} users`);
      utils.admin.listUsers.invalidate();
      setSelectedIds(new Set());
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  const locationMap = useMemo(() => {
    const map = new Map<string, string>();
    if (locations) {
      for (const loc of locations) {
        map.set(loc.id, loc.name);
      }
    }
    return map;
  }, [locations]);

  const allVisibleIds = useMemo(() => new Set(filteredUsers.map((u) => u.uid)), [filteredUsers]);

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.uid));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  const toggleSelect = (uid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleBulkAssign = (role: "admin" | "driver" | "staff") => {
    bulkAssignMutation.mutate({ uids: [...selectedIds], role });
    setBulkDropdownOpen(false);
  };

  const handleRowClick = (uid: string) => {
    setSelectedUserId(uid);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <EmptyState className="py-24">
        <EmptyState.Header pattern="circle">
          <EmptyState.FeaturedIcon icon={Users01} color="gray" theme="modern" />
        </EmptyState.Header>
        <EmptyState.Content>
          <EmptyState.Title>No users yet</EmptyState.Title>
          <EmptyState.Description>
            Users appear here after signing in with Google.
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative" ref={dropdownRef}>
          {selectedIds.size > 0 ? (
            <Button
              size="sm"
              color="primary"
              onClick={() => setBulkDropdownOpen((prev) => !prev)}
            >
              Assign Role ({selectedIds.size})
            </Button>
          ) : (
            <Button
              size="sm"
              color="secondary"
              isDisabled
            >
              Assign Role
            </Button>
          )}

          {bulkDropdownOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 w-40 rounded-lg border border-secondary bg-primary shadow-lg">
              {(["admin", "driver", "staff"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleBulkAssign(role)}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-secondary transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-primary_hover"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-72">
          <Input
            size="sm"
            placeholder="Search users..."
            icon={SearchLg}
            value={searchQuery}
            onChange={(v) => setSearchQuery(v)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-secondary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary bg-secondary_subtle">
              <th className="w-12 px-4 py-3">
                <Checkbox
                  isSelected={allSelected}
                  isIndeterminate={someSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all users"
                  size="sm"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Name
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Status
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isSelected = selectedUserId === user.uid;
              const initial = user.displayName.charAt(0).toUpperCase() || "?";
              const locationName = user.locationId ? locationMap.get(user.locationId) ?? "-" : "-";
              const roleDisplay = user.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : null;
              const pillStatus: "active" | "inactive" | "pending" =
                user.active === false ? "inactive" : user.role === null ? "pending" : "active";

              return (
                <tr
                  key={user.uid}
                  onClick={() => handleRowClick(user.uid)}
                  className={`border-b border-secondary last:border-b-0 cursor-pointer transition-colors hover:bg-primary_hover ${
                    isSelected ? "bg-brand-primary_alt" : ""
                  }`}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      isSelected={selectedIds.has(user.uid)}
                      onChange={() => toggleSelect(user.uid)}
                      aria-label={`Select ${user.displayName}`}
                      size="sm"
                      slot={null}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-xs font-semibold text-white">
                        {initial}
                      </div>
                      <span className="truncate text-sm font-medium text-primary">
                        {user.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3.5 text-sm text-tertiary">{user.email}</td>
                  <td className="px-4 py-3.5">
                    {roleDisplay ? (
                      <Badge
                        size="sm"
                        type="pill-color"
                        color={roleBadgeColor[user.role ?? ""] ?? "gray"}
                      >
                        {roleDisplay}
                      </Badge>
                    ) : (
                      <span className="text-sm italic text-quaternary">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-tertiary">{locationName}</td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={pillStatus} />
                  </td>
                  <td className="hidden md:table-cell px-4 py-3.5 text-sm text-tertiary">
                    {formatRelativeDate(user.lastLoginAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Detail Panel */}
      {selectedUserId !== null && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
