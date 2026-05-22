import React, { useState } from 'react';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';
import { IdRequestsTab } from '../../components/id-card/IdRequestsTab';
import { GeneratedIdsTab } from '../../components/id-card/GeneratedIdsTab';
import { VerificationLogsTab } from '../../components/id-card/VerificationLogsTab';

type Tab = 'requests' | 'generated' | 'logs';

const OrgIdCards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  return (
    <div className="space-y-0 font-poppins">
      <OrgAdminPageHeader 
        title="ID Card Management" 
        subtitle="Manage member ID card requests, generated cards, and verification logs"
      />
      
      <div className="flex gap-4 border-b border-gray-200 mb-6 px-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          ID Requests
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'generated' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Generated IDs
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Verification Logs
        </button>
      </div>

      {activeTab === 'requests' && <IdRequestsTab />}
      {activeTab === 'generated' && <GeneratedIdsTab />}
      {activeTab === 'logs' && <VerificationLogsTab />}
    </div>
  );
};

export default OrgIdCards;
