import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { relativeTime } from '../../lib/relativeTime';

export const LicenseVerificationLogsTab = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['licenseVerificationLogs'],
    queryFn: () => api.get('/licenses/logs').then(res => res.data),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading logs...</div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Scan Time</th>
              <th className="px-4 py-3">Verification Result</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Device Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No verification logs found.</td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {log.member?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {new Date(log.scanTime).toLocaleString()} ({relativeTime(log.scanTime)})
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold ${log.verificationResult === 'ACTIVE' ? 'text-green-600' : 'text-red-500'}`}>
                      {log.verificationResult}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-500">{log.ipAddress || 'N/A'}</td>
                  <td className="px-4 py-4 text-xs text-gray-400 max-w-xs truncate" title={log.deviceInfo}>
                    {log.deviceInfo || 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
