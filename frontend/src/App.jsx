import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setupApiInterceptors } from './services/apiInterceptor';
import { KanbanProvider } from './context/KanbanContext';
import { ChatProvider } from './context/ChatContext'
import HomePage from './components/HomePage';
import Board from './components/Board';
import UsersManagement from './components/UsersManagement';
import Header from './components/Header';
import Footer from './components/Footer';
import Bench from './components/Bench';
import Chat from './components/Chat';
import './styles/App.css';

setupApiInterceptors();

const ProtectedRoute = ({ children }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading authentication...</div>;
  }
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function Dashboard() {
  return (
    <KanbanProvider>
      <ChatProvider>
      <div className="app-container">
        <Header />
        <div className="content-container">
          <div className="app">
            <Bench />
            <Board />
          </div>
        </div>
        <Footer />
        <Chat />
      </div>
      </ChatProvider>
    </KanbanProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/board" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <KanbanProvider>
                <ChatProvider>
                  <div className="app-container">
                    <Header />
                    <div className="content-container">
                      <UsersManagement />
                    </div>
                    <Footer />
                    <Chat />
                  </div>
                </ChatProvider>
                </KanbanProvider>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;