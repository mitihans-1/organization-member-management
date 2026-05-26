export interface ContactMessage {
  id: string;
  scope: 'platform' | 'organization';
  organizationId?: string | null;
  organizationName?: string | null;
  senderUserId?: string | null;
  senderRole?: string | null;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}
