import React from 'react';
import { Save } from 'lucide-react';

const OrgSettings: React.FC = () => (
  <div className="max-w-2xl space-y-8">
    <div>
      <h1 className="text-2xl font-black text-gray-900">Organization settings</h1>
      <p className="text-sm text-gray-500">Preferences for your organization (connect to API later)</p>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 shadow-sm">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Public display name</label>
        <input type="text" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3" placeholder="Organization name" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default timezone</label>
        <select className="w-full border-2 border-gray-100 rounded-xl px-4 py-3">
          <option>UTC</option>
          <option>Africa/Addis_Ababa</option>
        </select>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-500"
      >
        <Save size={18} />
        Save
      </button>
    </div>
  </div>
);

export default OrgSettings;
