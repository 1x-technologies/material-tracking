import { useState } from "react";
import type { Printer } from "@material-tracking/shared";

interface PrinterListProps {
  printers: Printer[];
  onChange: (printers: Printer[]) => void;
}

interface PrinterFormState {
  name: string;
  ip: string;
  model: string;
  isDefault: boolean;
}

const emptyForm: PrinterFormState = { name: "", ip: "", model: "", isDefault: false };

export function PrinterList({ printers, onChange }: PrinterListProps) {
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<PrinterFormState>(emptyForm);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PrinterFormState>(emptyForm);

  const handleAddSave = () => {
    if (!newForm.name.trim() || !newForm.ip.trim()) return;
    const updated = newForm.isDefault
      ? printers.map((p) => ({ ...p, isDefault: false }))
      : [...printers];
    onChange([...updated, { name: newForm.name.trim(), ip: newForm.ip.trim(), model: newForm.model.trim(), isDefault: newForm.isDefault }]);
    setNewForm(emptyForm);
    setAddingNew(false);
  };

  const handleEditStart = (index: number) => {
    const p = printers[index];
    setEditingIndex(index);
    setEditForm({ name: p.name, ip: p.ip, model: p.model, isDefault: p.isDefault });
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    if (!editForm.name.trim() || !editForm.ip.trim()) return;
    const updated = printers.map((p, i) => {
      if (i === editingIndex) {
        return { name: editForm.name.trim(), ip: editForm.ip.trim(), model: editForm.model.trim(), isDefault: editForm.isDefault };
      }
      if (editForm.isDefault) return { ...p, isDefault: false };
      return p;
    });
    onChange(updated);
    setEditingIndex(null);
    setEditForm(emptyForm);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditForm(emptyForm);
  };

  const handleRemove = (index: number) => {
    onChange(printers.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-neutral-100 pt-4">
      <h3 className="text-sm font-semibold text-neutral-700 mb-3">Printers</h3>

      {printers.length === 0 && !addingNew && (
        <p className="text-sm text-neutral-400 mb-3">No printers configured.</p>
      )}

      <div className="space-y-2">
        {printers.map((printer, index) => {
          if (editingIndex === index) {
            return (
              <div key={`edit-${index}`} className="rounded-md border border-neutral-200 p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="IP Address"
                  value={editForm.ip}
                  onChange={(e) => setEditForm({ ...editForm, ip: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                />
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={editForm.isDefault}
                    onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                    className="size-4 rounded border-neutral-300"
                  />
                  Default printer
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={`printer-${index}`}
              className="flex items-center justify-between rounded-md border border-neutral-100 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">{printer.name}</span>
                  {printer.isDefault && (
                    <span className="inline-flex items-center rounded-full bg-brand-50 px-1.5 text-xs text-brand-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {printer.ip}{printer.model ? ` - ${printer.model}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditStart(index)}
                  aria-label={`Edit ${printer.name}`}
                  className="rounded p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${printer.name}`}
                  className="rounded p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {addingNew && (
        <div className="rounded-md border border-neutral-200 p-3 space-y-2 mt-2">
          <input
            type="text"
            placeholder="Name"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          <input
            type="text"
            placeholder="IP Address"
            value={newForm.ip}
            onChange={(e) => setNewForm({ ...newForm, ip: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          <input
            type="text"
            placeholder="Model"
            value={newForm.model}
            onChange={(e) => setNewForm({ ...newForm, model: e.target.value })}
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={newForm.isDefault}
              onChange={(e) => setNewForm({ ...newForm, isDefault: e.target.checked })}
              className="size-4 rounded border-neutral-300"
            />
            Default printer
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddSave}
              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setAddingNew(false); setNewForm(emptyForm); }}
              className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!addingNew && (
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="mt-3 text-brand-600 hover:text-brand-700 text-sm font-semibold transition-colors"
        >
          + Add Printer
        </button>
      )}
    </div>
  );
}
