import { useCallback, useEffect, useState } from "react";
import { AdminTabs } from "../components/admin/AdminTabs";
import { UserTable } from "../components/admin/UserTable";
import { trpc } from "../trpc";

export function AdminPage() {
  const [activeTab, setActiveTab] = useState(() => window.location.hash.slice(1) || "users");

  const { data: users } = trpc.admin.listUsers.useQuery();
  const { data: locations } = trpc.admin.listAllLocations.useQuery();

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id);
    window.location.hash = id;
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const userCount = users?.length ?? 0;
  const locationCount = locations?.length ?? 0;

  const tabs = [
    { id: "users", label: "Users", count: userCount },
    { id: "locations", label: "Locations", count: locationCount },
    { id: "settings", label: "Settings" },
    { id: "reports", label: "Reports" },
  ];

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Admin</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Manage users, locations, settings, and reports
      </p>

      <div className="mt-4">
        <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {activeTab === "users" && <UserTable />}
      {activeTab === "locations" && (
        <div className="py-12 text-center text-sm text-neutral-500">
          Locations tab coming in Plan 03
        </div>
      )}
      {activeTab === "settings" && (
        <div className="py-12 text-center text-sm text-neutral-500">
          Settings tab coming in Plan 03
        </div>
      )}
      {activeTab === "reports" && (
        <div className="py-12 text-center text-sm text-neutral-500">
          Reports tab coming in Plan 03
        </div>
      )}

      {/* AuditLog will be added in Plan 03 */}
    </div>
  );
}
