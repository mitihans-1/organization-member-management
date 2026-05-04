import axios from 'axios';

const CHAPA_URL = 'https://api.chapa.co/v1';

export const initializePayment = async (data: {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
}) => {
  try {
    const key = process.env.CHAPA_SECRET_KEY?.trim();
    if (!key) throw new Error('CHAPA_SECRET_KEY is missing in environment variables');
    
    console.log('Chapa Service: Using Secret Key (first 10 chars):', key.substring(0, 10) + '...');

    const response = await axios.post(`${CHAPA_URL}/transaction/initialize`, data, {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Chapa Initialization Error Details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to initialize Chapa payment');
  }
};

export const verifyTransaction = async (tx_ref: string) => {
  try {
    const key = process.env.CHAPA_SECRET_KEY;
    if (!key) throw new Error('CHAPA_SECRET_KEY is missing in environment variables');

    const response = await axios.get(`${CHAPA_URL}/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Chapa Verification Error Details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to verify Chapa payment');
  }
};
