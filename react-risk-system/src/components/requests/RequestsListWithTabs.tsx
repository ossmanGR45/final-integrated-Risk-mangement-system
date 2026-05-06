import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { UserRole } from '../../types';
import RequestsList from './RequestsList';
import NewRisksTab from './NewRisksTab';

interface RequestsListWithTabsProps {
  requests: any[];
  role: UserRole;
}

type TabKey = 'logged' | 'suggested';

const RequestsListWithTabs: React.FC<RequestsListWithTabsProps> = ({ requests, role }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('logged');

  const baseClass =
    'flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-xl font-bold transition-all';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-2 flex gap-2">
        <button
          onClick={() => setActiveTab('logged')}
          className={`${baseClass} ${
            activeTab === 'logged'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText size={24} />
          مخاطر تم طلب تسجيلها
        </button>

        <button
          onClick={() => setActiveTab('suggested')}
          className={`${baseClass} ${
            activeTab === 'suggested'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Plus size={24} />
          مخاطر تم اقتراح إضافتها
        </button>
      </div>

      <div>
        {activeTab === 'logged' && (
          <RequestsList requests={requests} role={role} mode="pending" />
        )}
        {activeTab === 'suggested' && <NewRisksTab role={role} />}
      </div>
    </div>
  );
};

export default RequestsListWithTabs;
