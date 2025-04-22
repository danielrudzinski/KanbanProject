import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import '../styles/HomePage.css';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const { token, isLoading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      if (token && !isLoading) {
        const expiration = localStorage.getItem('tokenExpiration');
        if (expiration && new Date().getTime() > parseInt(expiration)) {
          logout();
          return;
        }
        
        navigate('/board');
      }
    };
    
    validateToken();
  }, [token, isLoading, navigate, logout]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      login(response.token, response.expiresIn);
      navigate('/board');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.register({ username, email, password });
      setShowVerification(true);
      setVerificationEmail(email);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await authService.verifyAccount({ email: verificationEmail, verificationCode });
      setActiveTab('login');
      setShowVerification(false);
      alert('Account verified successfully! Please log in.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    try {
      await authService.resendVerificationCode(verificationEmail);
      alert('Verification code sent to your email.');
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div className="home-container">
      <div className="auth-container">
        <h1>Kanban Project</h1>
        
        {showVerification ? (
          <div className="verification-form">
            <h2>Verify Your Account</h2>
            <p>Enter the verification code sent to your email</p>
            
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Verification Code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
              
              <p className="resend-link">
                Didn't receive a code?{' '}
                <span onClick={handleResendCode}>Resend Code</span>
              </p>
            </form>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button
                className={activeTab === 'login' ? 'active' : ''}
                onClick={() => setActiveTab('login')}
              >
                Login
              </button>
              <button
                className={activeTab === 'register' ? 'active' : ''}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <button type="submit" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <button type="submit" disabled={loading}>
                    {loading ? 'Registering...' : 'Register'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;