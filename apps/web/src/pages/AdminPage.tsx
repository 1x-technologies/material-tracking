import { useCallback, useEffect, useState } from "react";
import { Settings01, Users01, MarkerPin01, BarChart01, Printer } from "@untitledui/icons";
import { Tabs, TabList, Tab, TabPanel } from "@/components/application/tabs/tabs";
import { UserTable } from "../components/admin/UserTable";
import { LocationTable } from "../components/admin/LocationTable";
import { SettingsForm } from "../components/admin/SettingsForm";
import { ReportsView } from "../components/admin/ReportsView";
import { PrinterSetup } from "../components/admin/PrinterSetup";
import { AuditLog } from "../components/admin/AuditLog";
import { trpc } from "../trpc";
import type { Key } from "react-aria-components";

export function AdminPage() {
  const [activeTab, setActiveTab] = useState(() => window.location.hash.slice(1) || "users");

  const { data: users } = trpc.admin.listUsers.useQuery();
  const { data: locations } = trpc.admin.listAllLocations.useQuery();

  const handleTabChange = useCallback((key: Key) => {
    const id = String(key);
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

  return (
    <div className="py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-display-xs font-semibold text-primary">Administration</h1>
        <p className="mt-1 text-md text-tertiary">
          Manage users, locations, settings, and reports
        </p>
      </div>

      {/* Tabs */}
      <Tabs selectedKey={activeTab} onSelectionChange={handleTabChange}>
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabList type="underline" size="sm">
            <Tab id="users" icon={Users01} badge={userCount > 0 ? userCount : undefined}>
              Users
            </Tab>
            <Tab id="locations" icon={MarkerPin01} badge={locationCount > 0 ? locationCount : undefined}>
              Locations
            </Tab>
            <Tab id="settings" icon={Settings01}>
              Settings
            </Tab>
            <Tab id="printers" icon={Printer}>
              Printers
            </Tab>
            <Tab id="reports" icon={BarChart01}>
              Reports
            </Tab>
          </TabList>
        </div>

        <TabPanel id="users" className="pt-6">
          <UserTable />
        </TabPanel>
        <TabPanel id="locations" className="pt-6">
          <LocationTable />
        </TabPanel>
        <TabPanel id="settings" className="pt-6">
          <SettingsForm />
        </TabPanel>
        <TabPanel id="printers" className="pt-6">
          <PrinterSetup />
        </TabPanel>
        <TabPanel id="reports" className="pt-6">
          <ReportsView />
        </TabPanel>
      </Tabs>

      {/* Audit log always visible below */}
      <AuditLog />
    </div>
  );
}
