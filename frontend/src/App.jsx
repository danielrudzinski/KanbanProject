import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Board from './components/Board';
import UsersManagement from './components/UsersManagement';
import Bench from './components/Bench';
import Header from './components/Header';
import Footer from './components/Footer';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<KanbanBoard />} />
            <Route path="/users" element={<UsersManagement />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

function KanbanBoard() {
  return (
    <div className="app">
      <Bench />
      <Board />
    </div>
  );
}

export default App;