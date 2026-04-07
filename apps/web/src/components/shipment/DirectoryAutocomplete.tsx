import { useEffect, useId, useRef, useState } from "react";
import { SearchSm } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Checkbox } from "@/components/base/checkbox/checkbox";
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
          <span className="block text-sm font-medium text-secondary">{label}</span>
          <Checkbox
            isSelected={isExternal}
            onChange={(checked) => handleToggleExternal(checked)}
            isDisabled={disabled}
            label="External contact"
            size="sm"
          />
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
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-secondary">
          {label}
        </label>
        <Checkbox
          isSelected={isExternal}
          onChange={(checked) => handleToggleExternal(checked)}
          isDisabled={disabled}
          label="External contact"
          size="sm"
        />
      </div>

      <Input
        aria-label={`Search ${label.toLowerCase()}`}
        value={query}
        onChange={(v) => {
          setQuery(v);
          setShowDropdown(true);
          if (value && !value.isExternal) {
            onChange(null);
          }
        }}
        onFocus={() => {
          if (debouncedQuery.length >= 2) setShowDropdown(true);
        }}
        placeholder="Search by name or email..."
        isDisabled={disabled}
        icon={SearchSm}
        size="sm"
      />

      {value && !value.isExternal && value.name && (
        <p className="mt-1 text-xs text-tertiary">
          Selected: {value.name} ({value.email})
        </p>
      )}

      {showDropdown && debouncedQuery.length >= 2 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-secondary bg-primary shadow-lg max-h-48 overflow-y-auto">
          {searchResult.isLoading && (
            <li className="px-3 py-2 text-sm text-tertiary">Searching...</li>
          )}
          {searchResult.data?.length === 0 && (
            <li className="px-3 py-2 text-sm text-tertiary">No results found</li>
          )}
          {searchResult.data?.map((person) => (
            <li key={person.uid}>
              <Button
                color="tertiary"
                size="sm"
                onClick={() => handleSelect(person)}
                className="w-full justify-start rounded-none px-3 py-3 min-h-[44px]"
              >
                <span className="font-medium text-primary">{person.name}</span>
                <span className="ml-2 text-tertiary">{person.email}</span>
                {person.department && (
                  <span className="ml-2 text-quaternary">-- {person.department}</span>
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
