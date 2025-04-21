export function setupApiInterceptors() {
  const originalFetch = window.fetch;
  
  window.fetch = async (url, options = {}) => {
    if (url.includes('/auth/')) {
      return originalFetch(url, options);
    }
  
    const token = localStorage.getItem('token');
    
    if (token) {
      const expiration = localStorage.getItem('tokenExpiration');
      if (expiration && new Date().getTime() > expiration) {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiration');
        window.location.href = '/login';
        return;
      }
    
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
    }
    
    const response = await originalFetch(url, options);
    
    return response.clone();
  };
}