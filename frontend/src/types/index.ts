export interface User {
  id: number;
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
  plan_id?: number;
  plan_expiry?: string;
  plan?: Plan;
  customAttributeValues?: MemberAttributeValue[];
}

export interface CustomAttributeDefinition {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  organizationId: string;
}

export interface MemberAttributeValue {
  id: number;
  memberId: number;
  attributeId: number;
  value: string;
  attribute?: CustomAttributeDefinition;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role?: string;
  status?: string;
  join_date?: string;
  last_active?: string;
  photo?: string;
  user_id: number;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  type: string;
  max_members: number;
  duration_days: number;
}

export interface Payment {
  id: number;
  user_id: number;
  plan_id: number;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id?: string;
  createdAt: string;
  plan?: Plan;
}

export interface Blog {
  id: number;
  title: string;
  content: string;
  image?: string;
  status?: string;
  category?: string;
  author_id: number;
  author?: { id: number; name: string; email: string };
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  location?: string;
  image?: string;
  status?: string;
  organizationId?: string;
  _count?: { attendees: number };
}
