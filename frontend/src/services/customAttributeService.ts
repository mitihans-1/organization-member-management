import api from './api';

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

export const customAttributeService = {
  getDefinitions: async () => {
    const response = await api.get<CustomAttributeDefinition[]>('/custom-attributes/definitions');
    return response.data;
  },

  createDefinition: async (data: Partial<CustomAttributeDefinition>) => {
    const response = await api.post<CustomAttributeDefinition>('/custom-attributes/definitions', data);
    return response.data;
  },

  updateDefinition: async (id: string, data: Partial<CustomAttributeDefinition>) => {
    const response = await api.put<CustomAttributeDefinition>(`/custom-attributes/definitions/${id}`, data);
    return response.data;
  },

  deleteDefinition: async (id: string) => {
    await api.delete(`/custom-attributes/definitions/${id}`);
  },

  getMemberValues: async (memberId: string) => {
    const response = await api.get<MemberAttributeValue[]>(`/custom-attributes/values/${memberId}`);
    return response.data;
  },

  updateMemberValues: async (memberId: string, values: { attributeId: string; value: any }[]) => {
    const response = await api.post(`/custom-attributes/values/${memberId}`, { values });
    return response.data;
  },
};
