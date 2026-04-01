import { useEffect, useId, useRef, useState } from "react";
import { trpc } from "../../trpc";
import { ExternalReceiverFields } from "./ExternalReceiverFields";

export interface DirectoryPerson {
  uid?: string;
  name: string;
  email: string;
  department?: string;
  isExternal: boolean;
  company?: string;
}

interface DirectoryAutocompleteProps {
  label: string;
  value: DirectoryPerson | null;
  onChange: (v: DirectoryPerson | null) => void;
  disabled?: boolean;
}

export function DirectoryAutocomplete({
  label,
  value,
  onChange,
  disabled = false,
}: DirectoryAutocompleteProps) {
  const inputId = useId();
  const [query, setQuery] = useState(value?.name ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isExternal, setIsExternal] = useState(value?.isExternal ?? false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchResult = trpc.directory.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && !isExternal },
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (person: { uid: string; name: string; email: string; department?: string }) => {
    const selected: DirectoryPerson = {
      uid: person.uid,
      name: person.name,
      email: person.email,
      department: person.department,
      isExternal: false,
    };
    onChange(selected);
    setQuery(person.name);
    setShowDropdown(false);
  };

  const handleToggleExternal = (checked: boolean) => {
    setIsExternal(checked);
    if (checked) {
      onChange(value ? { ...value, isExternal: true } : null);
      setShowDropdown(false);
    } else {
      onChange(null);
      setQuery("");
    }
  };

  const handleExternalChange = (fields: { name: string; company: string; email: string }) => {
    onChange({
      name: fields.name,
      email: fields.email,
      company: fields.company,
      isExternal: true,
    });
  };

  if (isExternal) {
    return (
      <div ref={containerRef}>
        <div className="flex items-center justify-between mb-2">
          <span className="block text-sm font-medium text-neutral-700">{label}</span>
          <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
            <input
              type="checkbox"
              checked={isExternal}
              onChange={(e) => handleToggleExternal(e.target.checked)}
              disabled={disabled}
              className="rounded border-neutral-300"
            />
            External contact
          </label>
        </div>
        <ExternalReceiverFields
          value={{
            name: value?.name ?? "",
            company: value?.company ?? "",
            email: value?.email ?? "",
          }}
          onChange={handleExternalChange}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
        <label className="flex items-center gap-1.5 text-xs text-neutral-500 cursor-pointer">
          <input
            type="checkbox"
            checked={isExternal}
            onChange={(e) => handleToggleExternal(e.target.checked)}
            disabled={disabled}
            className="rounded border-neutral-300"
          />
          External contact
        </label>
      </div>

      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          if (value && !value.isExternal) {
            onChange(null);
          }
        }}
        onFocus={() => {
          if (debouncedQuery.length >= 2) setShowDropdown(true);
        }}
        placeholder="Search by name or email…"
        disabled={disabled}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50 disabled:text-neutral-400"
      />

      {value && !value.isExternal && value.name && (
        <p className="mt-1 text-xs text-neutral-500">
          Selected: {value.name} ({value.email})
        </p>
      )}

      {showDropdown && debouncedQuery.length >= 2 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {searchResult.isLoading && (
            <li className="px-3 py-2 text-sm text-neutral-400">Searching…</li>
          )}
          {searchResult.data?.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-400">No results found</li>
          )}
          {searchResult.data?.map((person) => (
            <li key={person.uid}>
              <button
                type="button"
                onClick={() => handleSelect(person)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 focus:bg-neutral-50"
              >
                <span className="font-medium text-neutral-900">{person.name}</span>
                <span className="ml-2 text-neutral-500">{person.email}</span>
                {person.department && (
                  <span className="ml-2 text-neutral-400">· {person.department}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
