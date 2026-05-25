import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { User, CustomAttributeDefinition, MemberAttributeValue } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Download,
  Upload,
  List,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import { relativeTime } from '../lib/relativeTime';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import { customAttributeService } from '../services/customAttributeService';
import { IdRequestsTab } from '../components/id-card/IdRequestsTab';
import { GeneratedIdsTab } from '../components/id-card/GeneratedIdsTab';
import { VerificationLogsTab } from '../components/id-card/VerificationLogsTab';

type Tab = 'members' | 'id-requests' | 'generated-ids' | 'verification-logs';

const PAGE_SIZE = 7;

const Members: React.FC = () => {
  const { user } = useAuth();
  const isOrgAdmin = user?.role === 'orgAdmin';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    status: 'active',
    organizationId: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [selectedOrgCustomAttributes, setSelectedOrgCustomAttributes] = useState<CustomAttributeDefinition[]>([]);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();
  useBodyScrollLock(isModalOpen);

  const { data: members, isLoading } = useQuery<User[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then((res) => res.data),
  });

  const { data: organizations } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['organizations'],
    queryFn: () => api.get('/organizations').then((res) => res.data),
    enabled: isSuperAdmin,
  });

  const { data: customAttributeDefinitions } = useQuery<CustomAttributeDefinition[]>({
    queryKey: ['customAttributeDefinitions'],
    queryFn: () => customAttributeService.getDefinitions(),
    enabled: isOrgAdmin,
  });

  // Fetch custom attributes for selected organization when SuperAdmin
  useEffect(() => {
    if (!isSuperAdmin || !formData.organizationId) {
      setSelectedOrgCustomAttributes([]);
      return;
    }

    const fetchAttributes = async () => {
      try {
        const attrs = await customAttributeService.getDefinitions(formData.organizationId);
        setSelectedOrgCustomAttributes(attrs);
      } catch (error) {
        console.error('Error fetching custom attributes for selected org:', error);
        setSelectedOrgCustomAttributes([]);
      }
    };

    fetchAttributes();
  }, [formData.organizationId, isSuperAdmin]);

  // Determine which custom attributes to use
  const displayCustomAttributes = isSuperAdmin ? selectedOrgCustomAttributes : customAttributeDefinitions;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/members', data);
      const member = response.data;
      if (Object.keys(customFieldValues || {}).length > 0) {
        await customAttributeService.updateMemberValues(
          member.id,
          Object.entries(customFieldValues || {}).map(([attrId, value]) => ({
            attributeId: attrId,
            value,
          }))
        );
      }
      return member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      closeModal();
      alert('Member added successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating member:', error);
      alert(error.response?.data?.message || 'Failed to add member.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; member: any }) => {
      const response = await api.put(`/members/${data.id}`, data.member);
      if (Object.keys(customFieldValues || {}).length > 0) {
        await customAttributeService.updateMemberValues(
          data.id,
          Object.entries(customFieldValues || {}).map(([attrId, value]) => ({
            attributeId: attrId,
            value,
          }))
        );
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      closeModal();
      alert('Member updated successfully!');
    },
    onError: (error: any) => {
      console.error('Error updating member:', error);
      alert(error.response?.data?.message || 'Failed to update member.');
    }
  });

  const filteredMembers = useMemo(() => {
    const list = members ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [members, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, pageSafe]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMutation.mutate({ id: editingMember.id, member: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const exportMembers = () => {
    if (filteredMembers.length === 0) return;
    const rows = filteredMembers.map((m) => ({
      Name: m.name || '',
      Email: m.email || '',
      Role: m.role || '',
      JoinDate: m.join_date ? new Date(m.join_date).toISOString() : '',
      Organization: m.organization_name || '',
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String((row as Record<string, string>)[h]).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `members-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyBulkDelete = () => {
    if (selected.size === 0) return;
    const confirmed = window.confirm(`Delete ${selected.size} selected member(s)?`);
    if (!confirmed) return;
    setIsBulkDeleting(true);
    Promise.all(Array.from(selected).map((id) => api.delete(`/members/${id}`)))
      .then(() => {
        setSelected(new Set());
        setOpenActionMenuId(null);
        queryClient.invalidateQueries({ queryKey: ['members'] });
      })
      .finally(() => setIsBulkDeleting(false));
  };

  const importMembersFromCsv = async (file: File | null) => {
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 2) return;

      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIndex = header.indexOf('name');
      const emailIndex = header.indexOf('email');
      const passwordIndex = header.indexOf('password');
      if (nameIndex === -1 || emailIndex === -1) {
        alert('CSV must include at least "name" and "email" headers.');
        return;
      }

      const rows = lines.slice(1);
      for (const row of rows) {
        const cols = row.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const name = cols[nameIndex];
        const email = cols[emailIndex];
        const password = passwordIndex > -1 ? cols[passwordIndex] : 'password123';
        if (!name || !email) continue;
        await api.post('/members', { name, email, password, role: 'member', status: 'active' });
      }

      queryClient.invalidateQueries({ queryKey: ['members'] });
      setSelected(new Set());
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const onDocClick = () => setOpenActionMenuId(null);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const openModal = async (member?: User) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        password: '',
        role: member.role || 'member',
        status: 'active',
        organizationId: member.organizationId || '',
      });
      // Fetch custom field values for this member
      try {
        const values = await customAttributeService.getMemberValues(member.id);
        const valuesMap: Record<string, any> = {};
        values.forEach(v => {
          valuesMap[v.attributeId] = v.value;
        });
        setCustomFieldValues(valuesMap);
      } catch (err) {
        console.error('Error fetching custom field values', err);
      }
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'member',
        status: 'active',
        organizationId: '',
      });
      setCustomFieldValues({});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({ name: '', email: '', password: '', role: 'member', status: 'active', organizationId: '' });
    setCustomFieldValues({});
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((m) => m.id)));
  };

  const colCount =
    user?.role === 'SuperAdmin'
      ? 6
      : isOrgAdmin
        ? 8
        : 6;

  const lastActive = (m: User & { updatedAt?: string }) =>
    relativeTime(m.updatedAt || m.join_date || undefined);

  const joinFull = (m: User) =>
    m.join_date
      ? new Date(m.join_date).toLocaleString()
      : '—';

  const tableSection = (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-hidden overflow-y-visible">
      {isOrgAdmin && (
        <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
          <div className="relative flex-1 min-w-0 max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="search"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportMembers}
              disabled={filteredMembers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              <Download size={16} />
              Export
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              <Upload size={16} />
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => importMembersFromCsv(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={applyBulkDelete}
              disabled={selected.size === 0 || isBulkDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              <List size={16} />
              {isBulkDeleting ? 'Deleting...' : 'Bulk Delete'}
            </button>
          </div>
        </div>
      )}

      {!isOrgAdmin && (
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
            <tr>
              {isOrgAdmin && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll}
                    title="Select all on page"
                  />
                </th>
              )}
              {user?.role === 'SuperAdmin' && <th className="px-4 py-3">Organization</th>}
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 whitespace-nowrap">Join Date</th>
              {isOrgAdmin && <th className="px-4 py-3 whitespace-nowrap">Last Active</th>}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                  Loading members...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-gray-400">
                  No members found
                </td>
              </tr>
            ) : (
              paged.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/80">
                  {isOrgAdmin && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selected.has(member.id)}
                        onChange={() => toggleSelect(member.id)}
                        title="Select row"
                      />
                    </td>
                  )}
                  {user?.role === 'SuperAdmin' && (
                    <td className="px-4 py-4 text-gray-800 font-medium">
                      {(member as User & { organization_name?: string }).organization_name}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.profile_photo_path 
                            ? `http://localhost:5000/${member.profile_photo_path.replace(/\\/g, '/')}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=e0e7ff&color=3730a3`
                        }
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-100"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-indigo-600 font-semibold lowercase">{member.role || 'member'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-sky-100" title="Active" />
                  </td>
                  <td className="px-4 py-4 text-gray-600 whitespace-nowrap font-mono text-xs">
                    {joinFull(member)}
                  </td>
                  {isOrgAdmin && (
                    <td className="px-4 py-4 text-gray-600">{lastActive(member as User & { updatedAt?: string })}</td>
                  )}
                  <td className="px-4 py-4 text-right">
                    {isOrgAdmin ? (
                      <div className="inline-flex items-center gap-1 justify-end relative">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openModal(member)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => deleteMutation.mutate(member.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId((prev) => (prev === member.id ? null : member.id));
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openActionMenuId === member.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                openModal(member);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Edit Member
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                deleteMutation.mutate(member.id);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete Member
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs font-medium">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isOrgAdmin && filteredMembers.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <p>
            Showing {(pageSafe - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(pageSafe * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - pageSafe) <= 1)
              .map((n, i, arr) => (
                <React.Fragment key={n}>
                  {i > 0 && arr[i - 1] !== n - 1 && <span className="px-1">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[36px] py-1.5 rounded-lg border text-sm font-bold ${
                      pageSafe === n
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                </React.Fragment>
              ))}
            <button
              type="button"
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-0 font-poppins">
      {isOrgAdmin ? (
        <>
          <OrgAdminPageHeader
            title="Member Management"
            subtitle="Manage your organization members and ID cards"
            actions={
              activeTab === 'members' && (
                <button
                  type="button"
                  onClick={() => openModal()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Plus size={18} />
                  Add Member
                </button>
              )
            }
          />
          
          <div className="flex gap-4 border-b border-gray-200 mb-6 px-4">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'members' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab('id-requests')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'id-requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              ID Requests
            </button>
            <button
              onClick={() => setActiveTab('generated-ids')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'generated-ids' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Generated IDs
            </button>
            <button
              onClick={() => setActiveTab('verification-logs')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'verification-logs' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Verification Logs
            </button>
          </div>

          {activeTab === 'members' && tableSection}
          {activeTab === 'id-requests' && <IdRequestsTab />}
          {activeTab === 'generated-ids' && <GeneratedIdsTab />}
          {activeTab === 'verification-logs' && <VerificationLogsTab />}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-brand-dark tracking-tight">Members</h1>
          </div>
          {tableSection}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
              </div>
              {!editingMember && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  />
                </div>
              )}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Organization</label>
                  <select
                    required
                    title="Select organization"
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                  >
                    <option value="">Select an organization</option>
                    {organizations?.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] font-bold text-rose-500 uppercase tracking-widest">Mandatory</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
                <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optional</p>
              </div>

              {/* Custom Fields */}
              {displayCustomAttributes && displayCustomAttributes.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Additional Information</h4>
                  {displayCustomAttributes.map((attr) => (
                    <div key={attr.id}>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        {attr.name} {attr.required && <span className="text-rose-500">*</span>}
                      </label>
                      {attr.type === 'boolean' ? (
                        <div className="flex items-center gap-2 py-2">
                          <input
                            type="checkbox"
                            id={`attr-${attr.id}`}
                            checked={!!customFieldValues[attr.id]}
                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [attr.id]: e.target.checked })}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={`attr-${attr.id}`} className="text-sm text-gray-600">
                            {attr.name}
                          </label>
                        </div>
                      ) : (
                        <input
                          type={attr.type === 'number' ? 'number' : attr.type === 'date' ? 'date' : 'text'}
                          required={attr.required}
                          value={customFieldValues[attr.id] || ''}
                          onChange={(e) => setCustomFieldValues({ ...customFieldValues, [attr.id]: e.target.value })}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
                          placeholder={`Enter ${attr.name.toLowerCase()}`}
                        />
                      )}
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-widest ${attr.required ? 'text-rose-500' : 'text-slate-400'}`}>
                        {attr.required ? 'Mandatory' : 'Optional'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500"
                >
                  {editingMember ? 'Update' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
