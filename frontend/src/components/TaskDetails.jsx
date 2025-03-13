import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchUsers, assignUserToTask, fetchTask } from '../services/api';
import '../styles/components/TaskDetails.css';

function TaskDetails({ task, onClose }) {
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const panelRef = useRef(null);

  const handleRemoveUser = async (userId) => {
    try {
      await removeUserFromTask(task.id, userId);
      await loadTaskData(); // Refresh task data after removal
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Wystąpił błąd podczas usuwania użytkownika');
    }
  };

  const loadTaskData = async () => {
    try {
      const taskData = await fetchTask(task.id);
      const allUsers = await fetchUsers();
      
      setUsers(allUsers);
      
      if (taskData.userIds && taskData.userIds.length > 0) {
        const assigned = allUsers.filter(user => 
          taskData.userIds.includes(user.id)
        );
        setAssignedUsers(assigned);
      } else {
        setAssignedUsers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading task data:', error);
      setLoading(false);
    }
  };

  const handleAssignUser = async () => {
    try {
      await assignUserToTask(task.id, parseInt(selectedUserId));
      await loadTaskData(); // Refresh task data after assignment
      
      setSuccess(true);
      setSelectedUserId('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error assigning user:', error);
      alert('Wystąpił błąd podczas przypisywania użytkownika');
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadTaskData();
  }, [task.id]);

  if (loading) {
    return createPortal(
      <div className="task-details-overlay">
        <div className="task-details-panel loading">
          <p>Ładowanie...</p>
        </div>
      </div>,
      document.body
    );
  }
  
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
  
  
  return createPortal(
    <>
      <div className="task-details-overlay" onClick={onClose} />
      <div className="task-details-panel" ref={panelRef}>
        <div className="panel-header">
          <h3>{task.title}</h3>
          <button className="close-panel-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="user-section">
          {assignedUsers.length > 0 && (
            <div className="assigned-users">
              <h4>Przypisani użytkownicy:</h4>
              <div className="users-list">
                {assignedUsers.map(user => (
                  <div key={user.id} className="user-item">
                    <div className="user-avatar">
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name}</span>
                    <button 
                      className="remove-user-btn"
                      onClick={() => handleRemoveUser(user.id)}
                      title="Usuń użytkownika"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="assign-user-form">
            <label htmlFor="user-select">Przypisz nowego użytkownika:</label>
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
            
            <button onClick={handleAssignUser} disabled={!selectedUserId}>
              Przypisz
            </button>
          </div>

          {success && (
            <div className="success-message">
              Użytkownik został przypisany!
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

export default TaskDetails;