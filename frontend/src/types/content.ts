export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutTimelineItem {
  year: string;
  title: string;
  desc: string;
  image?: string;
}

export interface AboutContent {
  title: string;
  subtitle: string;
  mission: string;
  story: string;
  stats: AboutStat[];
  timeline?: AboutTimelineItem[];
}

export interface ContactContent {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  showLiveChat?: boolean;
  liveChatUrl?: string | null;
  facebookUrl?: string | null;
  telegramUrl?: string | null;
  linkedinUrl?: string | null;
  formRecipient?: string | null;
}

export interface PlatformContentResponse {
  scope: 'platform';
  platformName: string;
  about: AboutContent;
  contact: ContactContent;
}

export interface OrganizationContentResponse {
  scope: 'organization';
  organizationId: string;
  organizationName: string;
  about: AboutContent;
  contact: ContactContent;
}
