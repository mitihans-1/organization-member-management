import React, { useState } from 'react';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';
import { LicenseRequestsTab } from '../../components/license/LicenseRequestsTab';
import { GeneratedLicensesTab } from '../../components/license/GeneratedLicensesTab';
import { LicenseVerificationLogsTab } from '../../components/license/LicenseVerificationLogsTab';
import OrgLicensePlans from './OrgLicensePlans';

type Tab = 'requests' | 'generated' | 'logs' | 'plans';

const OrgLicenses: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('requests');

  return (
    <div className="space-y-0 font-poppins">
      <OrgAdminPageHeader 
        title="License Management" 
        subtitle="Manage member License requests, generated licenses, verification logs, and plans"
      />
      
      <div className="flex gap-4 border-b border-gray-200 mb-6 px-4">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          License Requests
        </button>
        <button
          onClick={() => setActiveTab('generated')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'generated' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Generated Licenses
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          Verification Logs
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'plans' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          License Plans
        </button>
      </div>

      {activeTab === 'requests' && <LicenseRequestsTab />}
      {activeTab === 'generated' && <GeneratedLicensesTab />}
      {activeTab === 'logs' && <LicenseVerificationLogsTab />}
      {activeTab === 'plans' && <OrgLicensePlans />}
    </div>
  );
};

export default OrgLicenses;
