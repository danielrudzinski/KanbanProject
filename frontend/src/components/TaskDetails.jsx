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
  const [avatarPreviews, setAvatarPreviews] = useState({});
  const panelRef = useRef(null);

  const removeUserFromTask = async (taskId, userId) => {
    try {
      const response = await fetch(`/tasks/${taskId}/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error removing user: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error removing user from task ${taskId}:`, error);
      throw error;
    }
  };

  const fetchUserAvatar = async (userId) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(`/users/${userId}/avatar`, {
          headers: {
            'Accept': 'image/*, application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch avatar');
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn(`Retry ${4 - retries} failed for user ${userId}:`, error);
        retries--;
        if (retries === 0) return null;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return null;
  };
  
  // Update loadTaskData to include avatar loading
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

        // Load avatars for assigned users
        const avatarPromises = assigned.map(async (user) => {
          const avatarUrl = await fetchUserAvatar(user.id);
          if (avatarUrl) {
            setAvatarPreviews(prev => ({
              ...prev,
              [user.id]: avatarUrl
            }));
          }
        });

        await Promise.all(avatarPromises);
      } else {
        setAssignedUsers([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading task data:', error);
      setLoading(false);
    }
  };

  const renderUserAvatar = (user) => {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E';
    
    return (
      <div className="user-avatar">
        <img 
          src={avatarPreviews[user.id] || defaultAvatar} 
          alt={`${user.name}'s avatar`}
          className="avatar-preview"
          onError={(e) => {
            e.target.src = defaultAvatar;
          }}
        />
      </div>
    );
  };

  const handleRemoveUser = async (userId) => {
    try {
      await removeUserFromTask(task.id, userId);
      
      // Revoke the object URL for the removed user's avatar to prevent memory leaks
      if (avatarPreviews[userId]) {
        URL.revokeObjectURL(avatarPreviews[userId]);
        setAvatarPreviews(prev => {
          const newPreviews = {...prev};
          delete newPreviews[userId];
          return newPreviews;
        });
      }
      
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

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    
    try {
      await assignUserToTask(task.id, parseInt(selectedUserId));
      
      // Fetch the avatar for the newly assigned user
      const avatarUrl = await fetchUserAvatar(parseInt(selectedUserId));
      if (avatarUrl) {
        setAvatarPreviews(prev => ({
          ...prev,
          [selectedUserId]: avatarUrl
        }));
      }
      
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
    
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      Object.values(avatarPreviews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [task.id]);

  // Position panel after it renders
  useEffect(() => {
    if (!loading) {
      positionPanel();
    }
  }, [loading]);

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
                  {renderUserAvatar(user)}
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
              {users
                .filter(user => !assignedUsers.some(assignedUser => assignedUser.id === user.id))
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))
              }
            </select>
            
            <button 
              onClick={handleAssignUser} 
              disabled={!selectedUserId}
              className="assign-btn"
            >
              Przypisz
            </button>
          </div>

          {success && (
            <div className="success-message">
              Operacja zakończona pomyślnie!
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

export default TaskDetails;