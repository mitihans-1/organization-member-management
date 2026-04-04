import api from './api';

export interface FaydaProfile {
  faydaId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  gender: string;
  verified: boolean;
}

const faydaService = {
  /**
   * Verify a Fayda ID (Mock)
   */
  verify: async (faydaId: string): Promise<FaydaProfile> => {
    const response = await api.post('/fayda/verify', { faydaId });
    return response.data;
  },

  /**
   * Login or signup with Fayda Profile
   */
  login: async (profile: FaydaProfile) => {
    const response = await api.post('/fayda/login', profile);
    return response.data;
  }
};

export default faydaService;
