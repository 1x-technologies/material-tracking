import { useState } from "react";
import { Edit01, Trash01, Plus, Printer as PrinterIcon } from "@untitledui/icons";
import type { Printer } from "@material-tracking/shared";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Badge } from "@/components/base/badges/badges";

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

  const renderForm = (
    form: PrinterFormState,
    setForm: (f: PrinterFormState) => void,
    onSave: () => void,
    onCancel: () => void,
  ) => (
    <div className="space-y-3 rounded-lg border border-secondary bg-primary p-4">
      <Input
        size="sm"
        placeholder="Name"
        value={form.name}
        onChange={(v) => setForm({ ...form, name: v })}
      />
      <Input
        size="sm"
        placeholder="IP Address"
        value={form.ip}
        onChange={(v) => setForm({ ...form, ip: v })}
      />
      <Input
        size="sm"
        placeholder="Model"
        value={form.model}
        onChange={(v) => setForm({ ...form, model: v })}
      />
      <Checkbox
        isSelected={form.isDefault}
        onChange={(checked) => setForm({ ...form, isDefault: checked })}
        label="Default printer"
        size="sm"
      />
      <div className="flex gap-2 pt-1">
        <Button size="xs" color="primary" onClick={onSave}>
          Save
        </Button>
        <Button size="xs" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="border-t border-secondary pt-6">
      <div className="mb-3 flex items-center gap-2">
        <PrinterIcon className="size-4 text-fg-quaternary" />
        <h3 className="text-sm font-medium text-secondary">Printers</h3>
      </div>

      {printers.length === 0 && !addingNew && (
        <p className="mb-3 text-sm text-quaternary">No printers configured.</p>
      )}

      <div className="space-y-2">
        {printers.map((printer, index) => {
          if (editingIndex === index) {
            return (
              <div key={`edit-${index}`}>
                {renderForm(editForm, setEditForm, handleEditSave, handleEditCancel)}
              </div>
            );
          }

          return (
            <div
              key={`printer-${index}`}
              className="flex items-center justify-between rounded-lg border border-secondary px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">{printer.name}</span>
                  {printer.isDefault && (
                    <Badge size="sm" type="pill-color" color="brand">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-tertiary">
                  {printer.ip}{printer.model ? ` -- ${printer.model}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="xs"
                  color="tertiary"
                  iconLeading={Edit01}
                  onClick={() => handleEditStart(index)}
                  aria-label={`Edit ${printer.name}`}
                />
                <Button
                  size="xs"
                  color="tertiary-destructive"
                  iconLeading={Trash01}
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${printer.name}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {addingNew && (
        <div className="mt-2">
          {renderForm(newForm, setNewForm, handleAddSave, () => { setAddingNew(false); setNewForm(emptyForm); })}
        </div>
      )}

      {!addingNew && (
        <Button
          size="xs"
          color="link-color"
          iconLeading={Plus}
          onClick={() => setAddingNew(true)}
          className="mt-3"
        >
          Add Printer
        </Button>
      )}
    </div>
  );
}
