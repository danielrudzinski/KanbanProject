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
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);
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
    try {
      const response = await fetch(`/users/${userId}/avatar`, {
        headers: {
          'Accept': 'image/*, application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.warn(`Could not fetch avatar for user ${userId}: ${response.status}`);
        return null;
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.warn(`Error fetching avatar for user ${userId}:`, error);
      return null;
    }
  };

  const fetchSubtasks = async (taskId) => {
    try {
      const response = await fetch(`/subtasks/task/${taskId}`);
      if (!response.ok) {
        throw new Error(`Error fetching subtasks: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching subtasks for task ${taskId}:`, error);
      return [];
    }
  };

  const addSubtask = async (taskId, title) => {
    try {
      const response = await fetch('/subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          completed: false,
          task: {
            id: taskId
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error adding subtask: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  };

  const toggleSubtaskCompletion = async (subtaskId) => {
    try {
      const response = await fetch(`/subtasks/${subtaskId}/change`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error toggling subtask completion: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error toggling subtask ${subtaskId} completion:`, error);
      throw error;
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      const response = await fetch(`/subtasks/${subtaskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Error deleting subtask: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting subtask ${subtaskId}:`, error);
      throw error;
    }
  };
  
  // Update loadTaskData to include subtasks loading
  const loadTaskData = async () => {
    try {
      const taskData = await fetchTask(task.id);
      const allUsers = await fetchUsers();
      const taskSubtasks = await fetchSubtasks(task.id);
      
      setUsers(allUsers);
      setSubtasks(taskSubtasks);
      
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

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    try {
      await addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      await loadTaskData(); // Refresh task data including subtasks
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding subtask:', error);
      alert('Wystąpił błąd podczas dodawania podzadania');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtaskCompletion(subtaskId);
      
      // Update the UI by toggling the completion status locally
      setSubtasks(prev => prev.map(subtask => {
        if (subtask.id === subtaskId) {
          return {
            ...subtask,
            completed: !subtask.completed
          };
        }
        return subtask;
      }));
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      alert('Wystąpił błąd podczas zmiany statusu podzadania');
    }
  };

  const confirmDeleteSubtask = (subtaskId) => {
    // Find the subtask to delete
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      setSubtaskToDelete(subtask);
      setShowDeleteConfirmation(true);
    }
  };

  const handleDeleteSubtask = async () => {
    if (!subtaskToDelete) return;
    
    try {
      await deleteSubtask(subtaskToDelete.id);
      
      // Update the UI by removing the deleted subtask
      setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskToDelete.id));
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Close the confirmation dialog
      setShowDeleteConfirmation(false);
      setSubtaskToDelete(null);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      alert('Wystąpił błąd podczas usuwania podzadania');
      setShowDeleteConfirmation(false);
      setSubtaskToDelete(null);
    }
  };

  const cancelDeleteSubtask = () => {
    setShowDeleteConfirmation(false);
    setSubtaskToDelete(null);
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
      setShowAssignForm(false);
      
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
          <div className="panel-actions">
            <button 
              className="assign-user-icon" 
              onClick={() => setShowAssignForm(!showAssignForm)}
              title="Przypisz użytkownika"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button className="close-panel-btn" onClick={onClose}>×</button>
          </div>
        </div>
  
        {/* User assignment dropdown */}
        {showAssignForm && (
          <div className="assign-user-dropdown">
            <div className="dropdown-header">
              <h4>Przypisz użytkownika</h4>
              <button 
                className="close-dropdown" 
                onClick={() => setShowAssignForm(false)}
              >
                ×
              </button>
            </div>
            <select 
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
        )}
  
        {/* Assigned users section */}
        {assignedUsers.length > 0 && (
          <div className="assigned-users-bar">
            <span>Przypisani:</span>
            <div className="avatar-list">
              {assignedUsers.map(user => (
                <div key={user.id} className="avatar-item" title={user.name}>
                  {renderUserAvatar(user)}
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
  
        {/* Subtasks Section - Now the main focus */}
        <div className="subtasks-section">
          <h4>Podzadania</h4>
          
          <div className="add-subtask-form">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Nazwa podzadania"
              className="subtask-input"
            />
            <button 
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim()}
              className="add-subtask-btn"
            >
              Dodaj
            </button>
          </div>
          
          {subtasks.length > 0 ? (
            <div className="subtasks-list">
              {subtasks.map(subtask => (
                <div key={subtask.id} className="subtask-item">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    id={`subtask-${subtask.id}`}
                    className="subtask-checkbox"
                  />
                  <label 
                    htmlFor={`subtask-${subtask.id}`}
                    className={subtask.completed ? 'completed' : ''}
                  >
                    {subtask.title}
                  </label>
                  <button
                    className="delete-subtask-btn"
                    onClick={() => confirmDeleteSubtask(subtask.id)}
                    title="Usuń podzadanie"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-subtasks">Brak podzadań</p>
          )}
        </div>
  
        {/* Delete confirmation dialog */}
        {showDeleteConfirmation && subtaskToDelete && (
          <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-dialog">
              <h4>Potwierdź usunięcie</h4>
              <p>Czy na pewno chcesz usunąć podzadanie: <strong>{subtaskToDelete.title}</strong>?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handleDeleteSubtask}
                  className="confirm-btn"
                >
                  Tak
                </button>
                <button 
                  onClick={cancelDeleteSubtask}
                  className="cancel-btn"
                >
                  Nie
                </button>
              </div>
            </div>
          </div>
        )}
  
        {success && (
          <div className="success-message">
            Operacja zakończona pomyślnie!
          </div>
        )}
      </div>
    </>,
    document.body
  );
}  

export default TaskDetails;