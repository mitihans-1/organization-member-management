export interface Organization {
  id: string;
  name: string;
  type: string;
  plan_id?: string;
  plan_expiry?: string;
  plan?: Plan;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'member' | 'orgAdmin' | 'SuperAdmin';
  organizationId?: string;
  organization_name?: string;
  organization_type?: string;
  profile_photo_path?: string;
  phone?: string;
  address?: string;
  sex?: string;
  join_date?: string;
  plan_id?: string;
  plan_expiry?: string;
  plan?: Plan;
  customAttributeValues?: MemberAttributeValue[];
}

export interface CustomAttributeDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  organizationId: string;
}

export interface MemberAttributeValue {
  id: string;
  memberId: string;
  attributeId: string;
  value: string;
  attribute?: CustomAttributeDefinition;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  join_date?: string;
  last_active?: string;
  photo?: string;
  user_id: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  type: string;
  max_members: number;
  duration_days: number;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id?: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id?: string;
  reference_id?: string;
  createdAt: string;
  plan?: Plan;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  image?: string;
  status?: string;
  category?: string;
  tags?: string;
  readTime?: number;
  author_id: string;
  author?: { id: string; name: string; email: string };
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location?: string;
  image?: string;
  status?: string;
  category?: string;
  capacity?: number;
  virtualLink?: string;
  contactEmail?: string;
  organizationId?: string;
  _count?: { attendees: number };
  price?: number;
  payment_required?: boolean;
  attendeesIds?: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image?: string;
  status?: string;
  category?: string;
  contactEmail?: string;
  organizationId?: string;
  _count?: { subscribers: number };
  price?: number;
  payment_required?: boolean;
  subscribersIds?: string[];
  isPredefined?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// EVENT MODULE - New Types
// ==========================================
export interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  registeredAt: string;
}

export interface EventAttendance {
  id: string;
  eventId: string;
  participantId: string;
  userId: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  qrCode?: string;
}

export interface EventReport {
  id: string;
  eventId: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface EventMedia {
  id: string;
  eventId: string;
  type: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface EventAnnouncement {
  id: string;
  eventId: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

// ==========================================
// SERVICE MODULE - New Types
// ==========================================
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
}

export interface ServiceRequest {
  id: string;
  serviceId: string;
  userId: string;
  requestNumber: string;
  status: string;
  priority: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceApproval {
  id: string;
  requestId: string;
  approverId: string;
  status: string;
  comments?: string;
  approvedAt?: string;
}

export interface ServiceAttachment {
  id: string;
  serviceId: string;
  name: string;
  type: string;
  url: string;
  required: boolean;
}

export interface ServiceInternalNote {
  id: string;
  requestId: string;
  createdBy: string;
  content: string;
  createdAt: string;
}

export interface ServiceFeedback {
  id: string;
  serviceId: string;
  userId: string;
  rating: number;
  comments?: string;
  submittedAt: string;
}

export interface ServiceApprovalAuditLog {
  id: string;
  requestId: string;
  approvalId?: string;
  action: string;
  actionBy: string;
  oldStatus?: string;
  newStatus: string;
  comments?: string;
  timestamp: string;
}

// ==========================================
// GENERAL - Activity & Notifications
// ==========================================
export interface ActivityHistory {
  id: string;
  userId: string;
  organizationId?: string;
  type: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface NotificationCenter {
  id: string;
  userId: string;
  organizationId?: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  link?: string;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

// ==========================================
// REPORT MODULE - Types
// ==========================================
export type ReportStatus = 'open' | 'in_progress' | 'resolved';
export type ReportPriority = 'low' | 'medium' | 'high';
export type ReportType = 'member_to_org' | 'org_to_superadmin';

export interface Report {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  reportType: ReportType;
  accepted: boolean;
  response?: string;
  attachment?: string;
  memberId?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  member?: User;
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface OrgAdminReportsResponse {
  memberReports: Report[];
  orgReports: Report[];
}

// ==========================================
// MEMBER SUBSCRIPTION & INVOICING - New Types
// ==========================================

export type BillingCycle = 'monthly' | 'quarterly' | 'annual';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void';

export interface MemberSubscriptionPlan {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  durationDays?: number;
  trialDays?: number;
  features: string[];
  isActive: boolean;
  maxMembers?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemberSubscription {
  id: string;
  organizationId: string;
  memberId: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  autoRenew: boolean;
  notes?: string;
  trialEndsAt?: string;
  plan?: MemberSubscriptionPlan;
  member?: Member;
  user?: User;
  organization?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  organizationId: string;
  userId?: string;
  memberId?: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  totalAmount: number;
  currency: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  isRecurring: boolean;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  organization?: any;
  user?: User;
  member?: Member;
  subscription?: MemberSubscription;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paymentId: string;
  amount: number;
  createdAt: string;
  invoice?: Invoice;
  payment?: Payment;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  type: string;
  sentAt: string;
  createdAt: string;
}

export interface MemberSubscriptionPayment {
  id: string;
  subscriptionId: string;
  paymentId: string;
  amount: number;
  createdAt: string;
  subscription?: MemberSubscription;
  payment?: Payment;
}

