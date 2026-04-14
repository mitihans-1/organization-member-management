import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Building2,
  Globe,
  Bell,
  Palette,
  CreditCard,
  AlertTriangle,
  Mail,
  Users,
  Calendar,
  Plus,
  Trash2,
  Type,
  Hash,
  Calendar as CalendarIcon,
  CheckSquare,
} from 'lucide-react';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';
import { useAuth } from '../../context/AuthContext';
import { customAttributeService, CustomAttributeDefinition } from '../../services/customAttributeService';
import api from '../../services/api';

const OrgSettings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('Africa/Addis_Ababa');
  const [locale, setLocale] = useState('en');
  const [emailDigest, setEmailDigest] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [memberJoinAlerts, setMemberJoinAlerts] = useState(false);
  const [publicTagline, setPublicTagline] = useState('');
  const [accentNote, setAccentNote] = useState('');

  // Custom Attributes State
  const [attributes, setAttributes] = useState<CustomAttributeDefinition[]>([]);
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newAttr, setNewAttr] = useState({ name: '', type: 'text' as const, required: false });
  const [isLoadingAttrs, setIsLoadingAttrs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setDisplayName(user?.organization_name ?? '');
    fetchAttributes();
  }, [user?.organization_name]);

  const fetchAttributes = async () => {
    try {
      setIsLoadingAttrs(true);
      const data = await customAttributeService.getDefinitions();
      setAttributes(data);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setIsLoadingAttrs(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      
      const response = await api.put('/auth/profile', {
        organization_name: displayName,
      });
      
      updateUser(response.data);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttr.name) return;
    try {
      await customAttributeService.createDefinition(newAttr);
      setNewAttr({ name: '', type: 'text', required: false });
      setIsAddingAttribute(false);
      fetchAttributes();
      setMessage({ type: 'success', text: 'Custom field added successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error adding attribute:', error);
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to add custom field. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteAttribute = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this custom field? All member data for this field will be lost.')) return;
    try {
      await customAttributeService.deleteDefinition(id);
      fetchAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
    }
  };

  const card = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 md:p-8';
  const label = 'mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500';
  const input =
    'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30';
  const sectionTitle = 'mb-4 flex items-center gap-2 text-sm font-bold text-slate-800';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'date': return <CalendarIcon className="h-4 w-4" />;
      case 'boolean': return <CheckSquare className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8 font-poppins">
      <OrgAdminPageHeader
        title="Settings"
        subtitle="Organization preferences, notifications, and defaults"
      />

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Custom Attributes Section */}
      <section className={card}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className={sectionTitle}>
            <Users className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
            Custom Member Fields
          </h2>
          <button
            onClick={() => setIsAddingAttribute(!isAddingAttribute)}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Field
          </button>
        </div>

        {isAddingAttribute && (
          <div className="mb-6 space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Field Name</label>
                <input
                  type="text"
                  value={newAttr.name}
                  onChange={(e) => setNewAttr({ ...newAttr, name: e.target.value })}
                  className={input}
                  placeholder="e.g. Emergency Contact"
                />
              </div>
              <div>
                <label className={label}>Field Type</label>
                <select
                title='attribute'
                  value={newAttr.type}
                  onChange={(e) => setNewAttr({ ...newAttr, type: e.target.value as any })}
                  className={input}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Checkbox / Boolean</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={newAttr.required}
                  onChange={(e) => setNewAttr({ ...newAttr, required: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Required field
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddingAttribute(false)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAttribute}
                  disabled={!newAttr.name}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Field
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoadingAttrs ? (
          <div className="py-4 text-center text-sm text-gray-500">Loading custom fields...</div>
        ) : attributes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
            <p className="text-sm text-gray-500">No custom fields defined yet.</p>
            <p className="mt-1 text-xs text-gray-400">Add fields like "Emergency Contact" or "Interests" to collect more member data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attributes.map((attr) => (
              <div 
                key={attr.id} 
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.1)]"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                    attr.type === 'text' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                    attr.type === 'number' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                    attr.type === 'date' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                    'bg-orange-50 text-orange-600 group-hover:bg-orange-100'
                  }`}>
                    {getTypeIcon(attr.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold capitalize tracking-tight text-gray-900">{attr.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                      <span className="font-semibold text-gray-600">{attr.type}</span>
                      {attr.required && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-rose-400"></span>
                          <span className="font-bold text-rose-500">Required</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteAttribute(attr.id)}
                  title="Remove field"
                  className="flex h-9 w-9 shrink-0 self-end sm:self-auto items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all duration-200 hover:bg-rose-100 hover:text-rose-600 sm:opacity-50 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>
          <Building2 className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          General
        </h2>
        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="org-display-name">
              Public display name
            </label>
            <input
              id="org-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={input}
              placeholder="Organization name"
              autoComplete="organization"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="org-tz">
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" aria-hidden />
                  Default timezone
                </span>
              </label>
              <select
                id="org-tz"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={input}
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="org-locale">
                Language
              </label>
              <select id="org-locale" value={locale} onChange={(e) => setLocale(e.target.value)} className={input}>
                <option value="en">English</option>
                <option value="am">Amharic</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>
          <Bell className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          Notifications
        </h2>
        <p className="mb-4 text-sm text-gray-600">Choose what we email admins about. (Saved locally in this demo.)</p>
        <ul className="space-y-3">
          <li className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Mail className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              Weekly digest
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={emailDigest}
              onClick={() => setEmailDigest((v) => !v)}
              className={`relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors ${
                emailDigest ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-7 w-7 translate-y-0.5 rounded-full bg-white shadow transition ${
                  emailDigest ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </li>
          <li className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Calendar className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              Event reminders
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={eventReminders}
              onClick={() => setEventReminders((v) => !v)}
              className={`relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors ${
                eventReminders ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-7 w-7 translate-y-0.5 rounded-full bg-white shadow transition ${
                  eventReminders ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </li>
          <li className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Users className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
              New member joins
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={memberJoinAlerts}
              onClick={() => setMemberJoinAlerts((v) => !v)}
              className={`relative inline-flex h-8 w-14 shrink-0 rounded-full transition-colors ${
                memberJoinAlerts ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-7 w-7 translate-y-0.5 rounded-full bg-white shadow transition ${
                  memberJoinAlerts ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
          </li>
        </ul>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>
          <Palette className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          Branding
        </h2>
        <div className="space-y-4">
          <div>
            <label className={label} htmlFor="org-tagline">
              Public tagline
            </label>
            <textarea
              id="org-tagline"
              value={publicTagline}
              onChange={(e) => setPublicTagline(e.target.value)}
              rows={3}
              className={`${input} resize-y min-h-[5rem]`}
              placeholder="Short line shown on your public pages"
            />
          </div>
          <div>
            <label className={label} htmlFor="org-accent">
              Notes for your team
            </label>
            <input
              id="org-accent"
              type="text"
              value={accentNote}
              onChange={(e) => setAccentNote(e.target.value)}
              className={input}
              placeholder="Internal note (optional)"
            />
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}>
          <CreditCard className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
          Plan &amp; billing
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Upgrade limits, view invoices, and manage payment methods on the upgrade page.
        </p>
        <Link
          to="/org-admin/upgrade"
          className="inline-flex w-full items-center justify-center rounded-xl border-2 border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 sm:w-auto"
        >
          Open upgrade &amp; billing
        </Link>
      </section>

      <section className={`${card} border-red-100 bg-red-50/40`}>
        <h2 className={`${sectionTitle} text-red-900`}>
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
          Danger zone
        </h2>
        <p className="text-sm text-red-900/80">
          Transfer ownership or delete the organization from the platform is not wired in this demo. Contact support
          when you implement destructive actions.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">Some settings are kept in the browser session until you add full API persistence.</p>
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 sm:w-auto min-h-[48px]"
        >
          {isSaving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Save className="h-[1.1rem] w-[1.1rem] shrink-0 sm:h-[1.15rem] sm:w-[1.15rem]" aria-hidden />
          )}
          {isSaving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
};

export default OrgSettings;
