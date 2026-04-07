import { Tabs, TabList, Tab } from "@/components/application/tabs/tabs";
import type { Key } from "react-aria-components";

interface TabItem {
  id: string;
  label: string;
  count: number;
}

interface FilterTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key: Key) => onTabChange(String(key))}
      >
        <TabList type="underline" size="sm">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              badge={tab.count > 0 ? tab.count : undefined}
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </div>
  );
}
