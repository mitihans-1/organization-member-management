export interface CreateEventParticipantDto {
  eventId: string;
  userId: string;
}

export interface CreateEventAttendanceDto {
  eventId: string;
  userId: string;
  qrCode?: string;
  checkedInBy?: string;
}

export interface CreateEventMediaDto {
  eventId: string;
  mediaType: 'image' | 'video' | 'document';
  url: string;
  caption?: string;
  uploadedBy: string;
}

export interface CreateEventReportDto {
  eventId: string;
  title: string;
  content: string;
  generatedBy: string;
  filePath?: string;
}

export interface CreateEventAnnouncementDto {
  eventId: string;
  title: string;
  content: string;
  sentBy: string;
}
