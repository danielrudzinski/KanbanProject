import { Link } from 'react-router-dom';
import { useState } from 'react';
import AddTaskForm from './AddTaskForm';
import AddBoardItemForm from './AddRowColumnForm';
import WipLimitControl from './WipLimitControl';
import logo from '/kanban-logo.png';

function Header() {
  const [activeForm, setActiveForm] = useState(null); // 'task', 'boardItem', or 'wip'

  const handleFormToggle = (formType) => {
    setActiveForm(activeForm === formType ? null : formType);
  };

  return (
    <>
      <header className="app-header">
        <Link to="/">
          <img src={logo} alt="Kanban Logo" className="app-logo" />
          <h1 className="app-title">Tablica Kanban</h1>
          <p className="app-subtitle">Zarządzaj swoimi zadaniami efektywnie</p>
        </Link>
        
        <div className="header-nav">
          <button 
            className="nav-link"
            onClick={() => handleFormToggle('task')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj zadanie
          </button>

          <button 
            className="nav-link"
            onClick={() => handleFormToggle('wip')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            Limit WIP
          </button>

          <button 
            className="nav-link"
            onClick={() => handleFormToggle('boardItem')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Dodaj wiersz/kolumnę
          </button>

          <Link to="/users" className="nav-link">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Użytkownicy
          </Link>
        </div>
      </header>

      {activeForm === 'task' && <AddTaskForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'wip' && <WipLimitControl onClose={() => setActiveForm(null)} />}
      {activeForm === 'boardItem' && <AddBoardItemForm onClose={() => setActiveForm(null)} />}
    </>
  );
}

export default Header;