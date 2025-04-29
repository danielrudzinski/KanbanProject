import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { KanbanProvider } from './context/KanbanContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KanbanProvider>
      <App />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </KanbanProvider>
  </StrictMode>,
)