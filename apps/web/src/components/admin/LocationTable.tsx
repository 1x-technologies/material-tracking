import { useState } from "react";
import { Spinner } from "../ui/Spinner";
import { StatusPill } from "./StatusPill";
import { LocationDetailPanel } from "./LocationDetailPanel";
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
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleAddClick}
            className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Add Location
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-neutral-500">
            No locations configured yet. Use &apos;Add Location&apos; to create one.
          </p>
        </div>

        {isCreating && (
          <LocationDetailPanel locationId={null} isNew={true} onClose={handlePanelClose} />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleAddClick}
          className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          Add Location
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Address
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                Printers
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
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
                  className={`border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${
                    isSelected ? "bg-brand-50" : ""
                  }`}
                >
                  <td className="px-3 py-3 text-sm font-semibold text-neutral-900">
                    {location.name}
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-600">
                    {location.address || "-"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      {printerCount} printer{printerCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-3 py-3">
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
