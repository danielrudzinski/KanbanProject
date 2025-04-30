import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
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
  const [longLoading, setLongLoading] = useState(false);
  
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const { token, isLoading } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      if (token && !isLoading) {
        const expiration = localStorage.getItem('tokenExpiration');
        if (expiration && new Date().getTime() > parseInt(expiration)) {
          logout();
          toast.info(t('auth.sessionExpired', 'Your session has expired. Please sign in again.'));
          return;
        }
        
        navigate('/board');
      }
    };
    
    validateToken();
  }, [token, isLoading, navigate, logout, t]);

  useEffect(() => {
    let timeoutId;
    
    if (loading) {
      timeoutId = setTimeout(() => {
        setLongLoading(true);
      }, 5000);
    } else {
      setLongLoading(false);
    }
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loading]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      login(response.token, response.expiresIn);
      toast.success(t('auth.loginSuccess', 'Successfully signed in!'));
      navigate('/board');
    } catch (error) {
      setError(error.message);
      toast.error(t('auth.loginFailed', 'Login failed:') + ' ' + error.message);
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
      toast.success(t('auth.registerSuccess', 'Account created! Please verify your email.'));
      setShowVerification(true);
      setVerificationEmail(email);
    } catch (error) {
      setError(error.message);
      toast.error(t('auth.registerFailed', 'Registration failed:') + ' ' + error.message);
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
      toast.success(t('auth.verifySuccess', 'Account verified successfully! Please log in.'));
    } catch (error) {
      setError(error.message);
      toast.error(t('auth.verifyFailed', 'Verification failed:') + ' ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    try {
      await authService.resendVerificationCode(verificationEmail);
      toast.info(t('auth.codeSent', 'Verification code sent to your email.'));
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div className="home-container">
      <div className="language-switcher-container">
        <LanguageSwitcher />
      </div>
      <div className="auth-container">
        <h1>{t('board.title', 'Kanban Project')}</h1>
        
        {showVerification ? (
          <div className="verification-form">
            <h2>{t('auth.verifyAccount', 'Verify Your Account')}</h2>
            <p>{t('auth.enterCode', 'Enter the verification code sent to your email')}</p>
            
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder={t('auth.verificationCode', 'Verification Code')}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                  <>
                  <span className="loading-spinner"></span>
                  <span className="loading-text">{t('auth.verifying', 'Verifying...')}</span>
                  </>
                ) : t('auth.verifyAccount', 'Verify Account')}
              </button>
              {loading && longLoading && (  
                <div className="long-loading-message">
                  {t('auth.pleaseWait', 'Please wait! We are working on handling this.')}
                </div>
              )}
              
              <p className="resend-link">
                {t('auth.noCode', 'Didn\'t receive a code?')}{' '}
                <span onClick={handleResendCode}>{t('auth.resendCode', 'Resend Code')}</span>
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
                {t('auth.login', 'Login')}
              </button>
              <button
                className={activeTab === 'register' ? 'active' : ''}
                onClick={() => setActiveTab('register')}
              >
                {t('auth.register', 'Register')}
              </button>
            </div>
            
            <div className="tab-content">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder={t('auth.email', 'Email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder={t('auth.password', 'Password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <button type="submit" disabled={loading} className="auth-button">
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        <span className="loading-text">{t('auth.signingIn', 'Signing In...')}</span>
                      </>
                    ) : t('auth.signIn', 'Sign In')}
                  </button>
                  {loading && longLoading && (
                    <div className="long-loading-message">
                      {t('auth.pleaseWait', 'Please wait! We are working on handling this.')}
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder={t('auth.username', 'Username')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder={t('auth.email', 'Email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="password"
                      placeholder={t('auth.password', 'Password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && <div className="error-message">{error}</div>}
                  
                  <button type="submit" disabled={loading} className="auth-button">
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        <span className="loading-text">{t('auth.registering', 'Registering...')}</span>
                      </>
                    ) : t('auth.register', 'Register')}
                  </button>
                  {loading && longLoading && (
                    <div className="long-loading-message">
                      {t('auth.pleaseWait', 'Please wait! We are working on handling this.')}
                    </div>
                  )}
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