import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "../ui/Spinner";
import { StatusPill } from "./StatusPill";
import { UserDetailPanel } from "./UserDetailPanel";
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl text-neutral-400 mb-4" aria-hidden="true">
          {"\uD83D\uDC64"}
        </span>
        <p className="text-sm text-neutral-500">
          No users yet. Users appear here after signing in with Google.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setBulkDropdownOpen((prev) => !prev)}
            disabled={selectedIds.size === 0}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              selectedIds.size > 0
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
            }`}
          >
            Assign Role{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </button>

          {bulkDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-10 w-40 rounded-md border border-neutral-200 bg-white shadow-lg">
              {(["admin", "driver", "staff"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleBulkAssign(role)}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 first:rounded-t-md last:rounded-b-md"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all users"
                  className="size-4 rounded border-neutral-300"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Location
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
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
                  className={`border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${
                    isSelected ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.uid)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelect(user.uid);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${user.displayName}`}
                      className="size-4 rounded border-neutral-300"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-8 rounded-full bg-brand-600 text-white text-xs font-semibold flex-shrink-0">
                        {initial}
                      </div>
                      <span className="text-sm font-semibold text-neutral-900 truncate">
                        {user.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{user.email}</td>
                  <td className="px-3 py-3 text-sm">
                    {roleDisplay ? (
                      <span className="text-neutral-900">{roleDisplay}</span>
                    ) : (
                      <span className="italic text-neutral-400">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-600">{locationName}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={pillStatus} />
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-600">
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
