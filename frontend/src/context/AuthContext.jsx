import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const text = await response.text();
          if (text) {
            const userData = JSON.parse(text);
            setUser(userData);
          } else {
            setUser(null);
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        logout();
      }
      
      setIsLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = (newToken, expiresIn) => {
    localStorage.setItem('token', newToken);
    
    const expirationTime = new Date().getTime() + (expiresIn * 1000);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);