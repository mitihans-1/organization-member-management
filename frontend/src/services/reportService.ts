import api from './api';
import { Report, OrgAdminReportsResponse } from '../types';

export const reportService = {
  async getMemberReports(): Promise<Report[]> {
    const response = await api.get('/reports/member');
    return response.data;
  },

  async getOrgReports(): Promise<OrgAdminReportsResponse> {
    const response = await api.get('/reports/org');
    return response.data;
  },

  async getSuperAdminReports(): Promise<Report[]> {
    const response = await api.get('/reports/superadmin');
    return response.data;
  },

  async createReport(data: { title: string; description: string; priority?: string; reportType?: string; attachment?: File | null }): Promise<Report> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.priority) formData.append('priority', data.priority);
    if (data.reportType) formData.append('reportType', data.reportType);
    if (data.attachment) formData.append('attachment', data.attachment);
    const response = await api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updateReport(id: string, data: Partial<Report>): Promise<Report> {
    const response = await api.put(`/reports/${id}`, data);
    return response.data;
  },

  async updateReportStatus(id: string, status: string): Promise<Report> {
    const response = await api.put(`/reports/${id}/status`, { status });
    return response.data;
  },

  async updateReportPriority(id: string, priority: string): Promise<Report> {
    const response = await api.put(`/reports/${id}/priority`, { priority });
    return response.data;
  },

  async acceptReport(id: string): Promise<Report> {
    const response = await api.put(`/reports/${id}/accept`);
    return response.data;
  },

  async replyToReport(id: string, response: string): Promise<Report> {
    const res = await api.put(`/reports/${id}/reply`, { response });
    return res.data;
  },

  async deleteReport(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },
};
