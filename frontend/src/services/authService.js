const API_BASE_URL = ''; 

export const authService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Registration failed');
    }
    
    return await response.json();
  },
  
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Invalid email or password');
    }
    
    return await response.json();
  },
  
  verifyAccount: async (verificationData) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Verification failed');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  },
  
  resendVerificationCode: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/resend?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to resend verification code');
    }
    
    return await response.text();
  }
};