export interface CreateServiceRequestDto {
  serviceId: string;
  userId: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
  description: string;
  dueDate?: Date;
}

export interface CreateServiceCategoryDto {
  name: string;
  description?: string;
  organizationId?: string;
}

export interface CreateServiceApprovalDto {
  requestId: string;
  approverId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  comments?: string;
  level: number;
}

export interface CreateServiceAttachmentDto {
  serviceId: string;
  name: string;
  url: string;
  uploadedBy: string;
}

export interface CreateServiceFeedbackDto {
  serviceId: string;
  userId: string;
  rating: number;
  comments?: string;
}

export interface CreateServiceInternalNoteDto {
  requestId: string;
  content: string;
  createdBy: string;
}
