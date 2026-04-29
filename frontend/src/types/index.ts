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
