import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Board from './components/Board';
import AddTaskForm from './components/AddTaskForm';
import AddColumnForm from './components/AddColumnForm';
import WipLimitControl from './components/WipLimitControl';
import UsersManagement from './components/UsersManagement';
import './styles/App.css';

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

// KanbanBoard component extracted from your current App component
function KanbanBoard() {
  return (
    <div className="app">
      <h1>Tablica Kanban</h1>
      <div className="navigation">
        <Link to="/users" className="user-management-btn">Zarządzanie Użytkownikami</Link>
      </div>
      <div className="controls">
        <AddTaskForm />
        <WipLimitControl />
        <AddColumnForm />
      </div>
      <Board />
    </div>
  );
}

export default App;