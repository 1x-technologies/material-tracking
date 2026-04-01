interface Tab {
  id: string;
  label: string;
  count: number;
}

interface FilterTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-neutral-200 mb-4">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isExceptions = tab.id === "exceptions";

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition-colors ${
              isActive
                ? "border-b-2 border-brand-600 text-brand-700 font-semibold"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isExceptions
                    ? "bg-red-100 text-red-700"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
