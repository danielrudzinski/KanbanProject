import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Board from './components/Board';
import AddTaskForm from './components/AddTaskForm';
import AddColumnForm from './components/AddColumnForm';
import WipLimitControl from './components/WipLimitControl';
import UsersManagement from './components/UsersManagement';
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
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showWipLimit, setShowWipLimit] = useState(false);

  return (
    <div className="app">
      <h1>Tablica Kanban</h1>
      
      <div className="menu-controls">
        <button 
          className="menu-item"
          onClick={() => setShowAddTask(!showAddTask)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Dodaj zadanie</span>
        </button>

        <button 
          className="menu-item"
          onClick={() => setShowWipLimit(!showWipLimit)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Limit WIP</span>
        </button>

        <button 
          className="menu-item"
          onClick={() => setShowAddColumn(!showAddColumn)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
          <span>Dodaj kolumnę</span>
        </button>

        <Link to="/users" className="menu-item">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Użytkownicy</span>
        </Link>
      </div>

      {showAddTask && <AddTaskForm />}
      {showWipLimit && <WipLimitControl />}
      {showAddColumn && <AddColumnForm />}
      
      <Board />
    </div>
  );
}

export default App;