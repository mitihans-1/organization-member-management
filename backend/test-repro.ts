import axios from 'axios';

async function test() {
  const API_URL = 'http://localhost:5000/api';
  
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@membershippro.demo',
      password: 'Demo123!'
    });
    
    const token = loginRes.data.token;
    console.log('Token acquired:', token);
    
    // 2. Try to post a custom attribute
    console.log('Posting custom attribute...');
    const postRes = await axios.post(`${API_URL}/custom-attributes/definitions`, {
      name: 'Test Attribute',
      type: 'text',
      required: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Success!', postRes.data);
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

test();
