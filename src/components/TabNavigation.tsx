import React from 'react';
import { LayoutDashboard, Wrench, PaintBucket, Archive } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'inco', label: 'INCOMET', icon: <Wrench className="w-5 h-5" /> },
  { id: 'anti', label: 'ANTICORR', icon: <PaintBucket className="w-5 h-5" /> },
  { id: 'archived', label: 'Despachados', icon: <Archive className="w-5 h-5" /> },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const getActiveStyles = (tabId: string) => {
    if (activeTab === tabId) {
      if (tabId === 'inco') return 'border-[#00843D] text-[#00843D]';
      if (tabId === 'anti') return 'border-[#BF0900] text-[#BF0900]';
      return 'border-blue-500 text-blue-600';
    }
    return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
  };

  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <nav className="-mb-px flex space-x-8 min-w-max px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
              ${getActiveStyles(tab.id)}
            `}
          >
            <div className={activeTab === tab.id ? (
              tab.id === 'inco' ? 'text-[#00843D]' :
              tab.id === 'anti' ? 'text-[#BF0900]' :
              'text-blue-600'
            ) : 'text-gray-500'}>
              {tab.icon}
            </div>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}