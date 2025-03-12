import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchUsers, assignUserToTask, fetchTask } from '../services/api';
import '../styles/components/TaskDetails.css';

function TaskDetails({ task, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const panelRef = useRef(null);
  
  // Load users and current assigned user when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users
        const usersData = await fetchUsers();
        setUsers(usersData);
        
        // Fetch complete task to get current assigned user
        const taskData = await fetchTask(task.id);
        if (taskData.user && taskData.user.id) {
          setSelectedUserId(taskData.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Position the panel
    if (panelRef.current) {
      positionPanel();
    }
    
    // Add window resize listener
    window.addEventListener('resize', positionPanel);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', positionPanel);
    };
  }, [task.id]);
  
  // Position panel relative to viewport
  const positionPanel = () => {
    if (!panelRef.current) return;
    
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    
    // Adjust if panel goes off screen
    if (rect.right > window.innerWidth) {
      panel.style.left = `${window.innerWidth - rect.width - 20}px`;
    }
    
    if (rect.bottom > window.innerHeight) {
      panel.style.top = `${window.innerHeight - rect.height - 20}px`;
    }
  };
  
  // Handle user assignment
  const handleAssignUser = async () => {
    if (!selectedUserId) {
      alert('Wybierz użytkownika!');
      return;
    }
    
    try {
      await assignUserToTask(task.id, selectedUserId);
      setSuccess(true);
      
      // Hide success message after a delay
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Wystąpił błąd podczas przypisywania użytkownika');
    }
  };
  
  return createPortal(
    <>
    <div className="task-details-overlay" onClick={onClose} />
    <div 
      id="task-details-panel" 
      className="task-details-panel" 
      ref={panelRef}
      data-task-id={task.id}
    >
      <div className="panel-header">
        <h3>{task.title}</h3>
        <button 
          className="close-panel-btn" 
          title="Zamknij panel"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      
      <div className="user-section">
          {task.user && (
            <div className="current-user">
              <label>Przypisany użytkownik:</label>
              <div className="user-info">
                <UserAvatar user={task.user} size="large" />
                <span>{task.user.name}</span>
              </div>
            </div>
          )}
        <label htmlFor="user-select">Przypisz użytkownika:</label>
        
        {loading ? (
          <p>Ładowanie użytkowników...</p>
        ) : (
          <>
            <select 
              id="user-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Wybierz użytkownika</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            
            <button onClick={handleAssignUser}>
              Przypisz
            </button>
            
            {success && (
              <div className="success-message">
                Użytkownik został przypisany!
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>,
    document.body
  );
}

export default TaskDetails;