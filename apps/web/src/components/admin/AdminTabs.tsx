import { Tabs, TabList, Tab } from "@/components/application/tabs/tabs";
import type { Key } from "react-aria-components";

interface AdminTab {
  id: string;
  label: string;
  count?: number;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function AdminTabs({ tabs, activeTab, onTabChange }: AdminTabsProps) {
  return (
    <Tabs
      selectedKey={activeTab}
      onSelectionChange={(key: Key) => onTabChange(String(key))}
    >
      <TabList type="underline" size="sm" fullWidth={false}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            badge={tab.count !== undefined && tab.count > 0 ? tab.count : undefined}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
}
