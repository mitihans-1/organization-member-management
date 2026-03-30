import React from 'react';
import { Save } from 'lucide-react';

const SystemConfig: React.FC = () => (
  <div className="max-w-2xl space-y-8">
    <div>
      <h1 className="text-2xl font-black text-slate-900">System configuration</h1>
      <p className="text-sm text-slate-500">Global platform settings (UI shell — wire to API as needed)</p>
    </div>

    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
      <label className="block text-sm font-bold text-slate-700">Platform name</label>
      <input
        type="text"
        defaultValue="OMMS"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
      <label className="block text-sm font-bold text-slate-700">Support email</label>
      <input
        type="email"
        placeholder="support@example.com"
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
      />
      <label className="block text-sm font-bold text-slate-700">Maintenance mode</label>
      <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
        <option>Off</option>
        <option>On</option>
      </select>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-500"
      >
        <Save size={18} />
        Save changes
      </button>
    </div>
  </div>
);

export default SystemConfig;
