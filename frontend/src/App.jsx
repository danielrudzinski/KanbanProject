import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Board from './components/Board';
import AddTaskForm from './components/AddTaskForm';
import AddColumnForm from './components/AddColumnForm';
import AddRowForm from './components/AddRowForm';
import WipLimitControl from './components/WipLimitControl';
import UsersManagement from './components/UsersManagement';
import Bench from './components/Bench'; // Import the new Bench component
import './styles/App.css';
import { useState } from 'react';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KanbanBoard />} />
        <Route path="/users" element={<UsersManagement />} />
      </Routes>
    </Router>
  );
}

// KanbanBoard component extracted from current App component
function KanbanBoard() {
  const [activeForm, setActiveForm] = useState(null); // 'task', 'column', 'row', or 'wip'

  const handleFormToggle = (formType) => {
    setActiveForm(activeForm === formType ? null : formType);
  };

  return (
    <div className="app">
      <h1>Tablica Kanban</h1>
      
      <div className="menu-controls">
        <button 
          className="menu-item"
          onClick={() => handleFormToggle('task')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Dodaj zadanie</span>
        </button>

        <button 
          className="menu-item"
          onClick={() => handleFormToggle('wip')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          <span>Limit WIP</span>
        </button>

        <button 
          className="menu-item"
          onClick={() => handleFormToggle('column')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Dodaj kolumnę</span>
        </button>

        <button 
          className="menu-item"
          onClick={() => handleFormToggle('row')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
          <span>Dodaj wiersz</span>
        </button>

        <Link to="/users" className="menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Użytkownicy</span>
        </Link>
      </div>

      {activeForm === 'task' && <AddTaskForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'wip' && <WipLimitControl onClose={() => setActiveForm(null)} />}
      {activeForm === 'column' && <AddColumnForm onClose={() => setActiveForm(null)} />}
      {activeForm === 'row' && <AddRowForm onClose={() => setActiveForm(null)} />}

      <Bench />

      <Board />
    </div>
  );
}

export default App;