
// Predefined Plans
export const predefinedPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing_cycle: 'monthly',
    type: 'Standard',
    max_members: 10,
    duration_days: 30,
    allowed_features: [
      'overview',
      'members',
      'contact',
      'subscriptions',
      'payments',
      'file-sharing',
      'profile'
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billing_cycle: 'monthly',
    type: 'Business',
    max_members: 50,
    duration_days: 30,
    allowed_features: [
      'overview',
      'members',
      'events',
      'services',
      'news',
      'chat',
      'contact',
      'subscriptions',
      'payments',
      'file-sharing',
      'profile',
      'tickets'
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billing_cycle: 'monthly',
    type: 'Enterprise',
    max_members: 200,
    duration_days: 30,
    allowed_features: [
      'overview',
      'members',
      'events',
      'services',
      'news',
      'chat',
      'contact',
      'subscriptions',
      'payments',
      'file-sharing',
      'reports',
      'id-cards',
      'licenses',
      'profile',
      'tickets'
    ],
  },
];

// Predefined Member Subscription Plans
export const predefinedMemberPlans = [
  {
    id: 'member-free',
    name: 'Free',
    description: 'Basic access to organization features',
    price: 0,
    currency: 'ETB',
    billingCycle: 'monthly',
    durationDays: 30,
    features: ['overview', 'profile'],
    isActive: true,
    trialDays: null,
    maxMembers: null,
    sortOrder: 0,
  },
  {
    id: 'member-basic',
    name: 'Basic',
    description: 'Essential features for active members',
    price: 100,
    currency: 'ETB',
    billingCycle: 'monthly',
    durationDays: 30,
    features: ['overview', 'profile', 'events', 'services', 'news', 'contact'],
    isActive: true,
    trialDays: 7,
    maxMembers: null,
    sortOrder: 1,
  },
  {
    id: 'member-premium',
    name: 'Premium',
    description: 'Full access to all organization features',
    price: 300,
    currency: 'ETB',
    billingCycle: 'monthly',
    durationDays: 30,
    features: [
      'overview',
      'profile',
      'events',
      'services',
      'news',
      'contact',
      'subscriptions',
      'payments',
      'tickets',
      'chat',
      'id-cards',
      'licenses'
    ],
    isActive: true,
    trialDays: 14,
    maxMembers: null,
    sortOrder: 2,
  },
];

// Platform services/events/blogs: see predefinedCatalogStore.ts

// Predefined Features (for reference)
export const ALL_FEATURES = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'members', label: 'Member Management' },
  { id: 'events', label: 'Events' },
  { id: 'services', label: 'Services' },
  { id: 'news', label: 'News' },
  { id: 'contact', label: 'Contact' },
  { id: 'subscriptions', label: 'Member Subscriptions' },
  { id: 'payments', label: 'Payments' },
  { id: 'file-sharing', label: 'File Sharing' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'chat', label: 'Chat' },
  { id: 'reports', label: 'Reports' },
  { id: 'id-cards', label: 'ID Cards' },
  { id: 'licenses', label: 'Licenses' },
  { id: 'profile', label: 'Profile' },
];

export const defaultFeatures = {
  free: ['overview', 'members', 'contact', 'subscriptions', 'payments', 'file-sharing', 'profile'],
  pro: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'file-sharing', 'profile', 'tickets'],
  enterprise: ['overview', 'members', 'events', 'services', 'news', 'chat', 'contact', 'subscriptions', 'payments', 'file-sharing', 'reports', 'id-cards', 'licenses', 'profile', 'tickets'],
};
