import { Link, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddBoardItemForm from './AddRowColumnForm';
import WipLimitControl from './WipLimitControl';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../context/AuthContext';

function Header() {
  const [activeForm, setActiveForm] = useState(null); // 'task', 'boardItem', or 'wip'
  const [isSticky, setIsSticky] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleFormToggle = (formType) => {
    setActiveForm(activeForm === formType ? null : formType);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 0);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header className={`app-header ${isSticky ? 'sticky' : ''}`}>
        <Link to="/">
          <img src="/kanban-logo.png" alt="Kanban Logo" className="app-logo" />
          <h1 className="app-title">{t('board.title')}</h1>
          <p className="app-subtitle">{t('board.subtitle')}</p>
          <LanguageSwitcher />
        </Link>
        
        <div className="header-nav">
          <button 
            className="nav-link"
            onClick={() => handleFormToggle('task')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('header.addTask')}
          </button>

          <button 
            className="nav-link"
            onClick={() => handleFormToggle('wip')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            {t('header.wipLimit')}
          </button>

          <button 
            className="nav-link"
            onClick={() => handleFormToggle('boardItem')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            {t('header.addBoardItem')}
          </button>

          <Link to="/users" className="nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {t('header.users')}
          </Link>
          
          <button 
            className="nav-link logout-btn"
            onClick={handleLogout}
            style={{ marginLeft: 'auto' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t('header.logout')}
          </button>
        </div>
      </header>

      {activeForm === 'task' && <AddTaskForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'wip' && <WipLimitControl onClose={() => setActiveForm(null)} />}
      {activeForm === 'boardItem' && <AddBoardItemForm onClose={() => setActiveForm(null)} />}
    </>
  );
}

export default Header;