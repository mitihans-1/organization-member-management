import api from './api';

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

export const customAttributeService = {
  getDefinitions: async () => {
    const response = await api.get<CustomAttributeDefinition[]>('/custom-attributes/definitions');
    return response.data;
  },

  createDefinition: async (data: Partial<CustomAttributeDefinition>) => {
    const response = await api.post<CustomAttributeDefinition>('/custom-attributes/definitions', data);
    return response.data;
  },

  updateDefinition: async (id: number, data: Partial<CustomAttributeDefinition>) => {
    const response = await api.put<CustomAttributeDefinition>(`/custom-attributes/definitions/${id}`, data);
    return response.data;
  },

  deleteDefinition: async (id: number) => {
    await api.delete(`/custom-attributes/definitions/${id}`);
  },

  getMemberValues: async (memberId: number) => {
    const response = await api.get<MemberAttributeValue[]>(`/custom-attributes/values/${memberId}`);
    return response.data;
  },

  updateMemberValues: async (memberId: number, values: { attributeId: number; value: any }[]) => {
    const response = await api.post(`/custom-attributes/values/${memberId}`, { values });
    return response.data;
  },
};
