import { Event, Service } from '../types';
import { FilterFieldDef } from './filters';

function capitalizeStatus(status?: string): string {
  if (!status) return 'Draft';
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function eventOrganizer(event: Event): string {
  const name = event.organizer?.trim();
  if (name) return name;
  if (event.contactEmail) {
    const local = event.contactEmail.split('@')[0]?.trim();
    if (local) {
      return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  }
  return 'Organization';
}

export const SERVICE_FILTER_FIELDS: FilterFieldDef<Service>[] = [
  { key: 'category', title: 'Category', getValue: (s) => s.category || 'General' },
  { key: 'status', title: 'Status', getValue: (s) => capitalizeStatus(s.status || 'Active') },
  { key: 'department', title: 'Department', getValue: (s) => s.department || 'Unassigned' },
  { key: 'owner', title: 'Service Owner', getValue: (s) => s.owner || 'Unassigned' },
  { key: 'duration', title: 'Duration', getValue: (s) => s.duration || 'Not specified' },
  {
    key: 'pricing',
    title: 'Pricing',
    getValue: (s) => (s.payment_required && s.price ? 'Paid' : 'Free'),
  },
  { key: 'renewalRule', title: 'Renewal', getValue: (s) => s.renewalRule || 'None' },
];

export const SERVICE_SEARCH_FIELDS: (keyof Service)[] = [
  'title',
  'description',
  'category',
  'code',
  'owner',
  'department',
  'duration',
  'eligibilityRules',
  'contactEmail',
  'renewalRule',
  'status',
];

export const EVENT_FILTER_FIELDS: FilterFieldDef<Event>[] = [
  { key: 'location', title: 'Location', getValue: (e) => e.location || 'TBD' },
  { key: 'status', title: 'Status', getValue: (e) => capitalizeStatus(e.status) },
  { key: 'category', title: 'Category', getValue: (e) => e.category || 'General' },
  { key: 'organizer', title: 'Organizer', getValue: eventOrganizer },
  {
    key: 'pricing',
    title: 'Pricing',
    getValue: (e) => (e.payment_required && e.price ? 'Paid' : 'Free'),
  },
];

export const EVENT_SEARCH_FIELDS: (keyof Event)[] = [
  'title',
  'description',
  'location',
  'organizer',
  'category',
  'status',
  'contactEmail',
  'virtualLink',
];

/** Computed values included in event text search (e.g. organizer fallback). */
export const EVENT_SEARCH_GETTERS = [eventOrganizer];

export const SERVICE_SEARCH_GETTERS: ((s: Service) => string | undefined)[] = [
  (s) => (s.payment_required && s.price ? 'Paid' : 'Free'),
];
