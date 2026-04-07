import { useState } from "react";
import { Plus, MarkerPin01 } from "@untitledui/icons";
import { Spinner } from "../ui/Spinner";
import { StatusPill } from "./StatusPill";
import { LocationDetailPanel } from "./LocationDetailPanel";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/application/empty-state/empty-state";
import { trpc } from "../../trpc";

export function LocationTable() {
  const { data: locations, isLoading } = trpc.admin.listAllLocations.useQuery();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddClick = () => {
    setIsCreating(true);
    setSelectedLocationId(null);
  };

  const handleRowClick = (id: string) => {
    setSelectedLocationId(id);
    setIsCreating(false);
  };

  const handlePanelClose = () => {
    setSelectedLocationId(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <Button size="sm" color="primary" iconLeading={Plus} onClick={handleAddClick}>
            Add Location
          </Button>
        </div>

        <EmptyState className="py-24">
          <EmptyState.Header pattern="circle">
            <EmptyState.FeaturedIcon icon={MarkerPin01} color="gray" theme="modern" />
          </EmptyState.Header>
          <EmptyState.Content>
            <EmptyState.Title>No locations configured</EmptyState.Title>
            <EmptyState.Description>
              Use "Add Location" above to create your first location.
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState>

        {isCreating && (
          <LocationDetailPanel locationId={null} isNew={true} onClose={handlePanelClose} />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <Button size="sm" color="primary" iconLeading={Plus} onClick={handleAddClick}>
          Add Location
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-secondary">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary bg-secondary_subtle">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Printers
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-tertiary">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => {
              const isSelected = selectedLocationId === location.id;
              const printerCount = location.printers.length;

              return (
                <tr
                  key={location.id}
                  onClick={() => handleRowClick(location.id)}
                  className={`border-b border-secondary last:border-b-0 cursor-pointer transition-colors hover:bg-primary_hover ${
                    isSelected ? "bg-brand-primary_alt" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-sm font-medium text-primary">
                    {location.name}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-tertiary">
                    {location.address || "-"}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge size="sm" type="pill-color" color="gray">
                      {printerCount} printer{printerCount !== 1 ? "s" : ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={location.active ? "active" : "inactive"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {(selectedLocationId !== null || isCreating) && (
        <LocationDetailPanel
          locationId={selectedLocationId}
          isNew={isCreating}
          onClose={handlePanelClose}
        />
      )}
    </div>
  );
}
