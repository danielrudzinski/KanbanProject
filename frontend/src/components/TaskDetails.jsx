import { useState, useEffect, useRef, useContext } from 'react';
import { useKanban } from '../context/KanbanContext';
import { createPortal } from 'react-dom';
import { fetchUsers, assignUserToTask, fetchTask, removeUserFromTask, getUserAvatar, fetchSubTasks, addSubTask, toggleSubTaskCompletion, deleteSubTask } from '../services/api';
import '../styles/components/TaskDetails.css';

function TaskDetails({ task, onClose }) {
  const { refreshTasks } = useKanban();
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
  const [showUserDeleteConfirmation, setShowUserDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const panelRef = useRef(null);
  
  // Update loadTaskData to include subtasks loading
  const loadTaskData = async () => {
    try {
      const taskData = await fetchTask(task.id);
      const allUsers = await fetchUsers();
      const taskSubtasks = await fetchSubTasks(task.id);
      
      setUsers(allUsers);
      setSubtasks(taskSubtasks);
      
      if (taskData.userIds && taskData.userIds.length > 0) {
        const assigned = allUsers.filter(user => 
          taskData.userIds.includes(user.id)
        );
        setAssignedUsers(assigned);

        // Load avatars for assigned users
        const avatarPromises = assigned.map(async (user) => {
          const avatarUrl = await getUserAvatar(user.id);
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

  const handleaddSubTask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    try {
      await addSubTask(task.id, newSubtaskTitle.trim());
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
      await toggleSubTaskCompletion(subtaskId);
      
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

  const confirmdeleteSubTask = (subtaskId) => {
    // Find the subtask to delete
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      setSubtaskToDelete(subtask);
      setShowDeleteConfirmation(true);
    }
  };

  const handledeleteSubTask = async () => {
    if (!subtaskToDelete) return;
    
    try {
      await deleteSubTask(subtaskToDelete.id);
      
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

  const canceldeleteSubTask = () => {
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

  const confirmRemoveUser = (userId) => {
    // Find the user to delete
    const user = assignedUsers.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setShowUserDeleteConfirmation(true);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete) return;
    
    try {
      await removeUserFromTask(task.id, userToDelete.id);
      
      // Revoke the object URL for the removed user's avatar to prevent memory leaks
      if (avatarPreviews[userToDelete.id]) {
        URL.revokeObjectURL(avatarPreviews[userToDelete.id]);
        setAvatarPreviews(prev => {
          const newPreviews = {...prev};
          delete newPreviews[userToDelete.id];
          return newPreviews;
        });
      }
      
      await loadTaskData(); // Refresh task data after removal
      refreshTasks(); // Refresh tasks in the context

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Close the confirmation dialog
      setShowUserDeleteConfirmation(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Wystąpił błąd podczas usuwania użytkownika');
      setShowUserDeleteConfirmation(false);
      setUserToDelete(null);
    }
  };

  const cancelRemoveUser = () => {
    setShowUserDeleteConfirmation(false);
    setUserToDelete(null);
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    
    try {
      await assignUserToTask(task.id, parseInt(selectedUserId));
      
      // Fetch the avatar for the newly assigned user
      const avatarUrl = await getUserAvatar(parseInt(selectedUserId));
      if (avatarUrl) {
        setAvatarPreviews(prev => ({
          ...prev,
          [selectedUserId]: avatarUrl
        }));
      }
      
      await loadTaskData(); // Refresh task data after assignment
      refreshTasks(); // Refresh tasks in the context

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
                    onClick={() => confirmRemoveUser(user.id)}
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
              onClick={handleaddSubTask}
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
                    onClick={() => confirmdeleteSubTask(subtask.id)}
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
  
        {/* Delete subtask confirmation dialog */}
        {showDeleteConfirmation && subtaskToDelete && (
          <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-dialog">
              <h4>Potwierdź usunięcie</h4>
              <p>Czy na pewno chcesz usunąć podzadanie: <strong>{subtaskToDelete.title}</strong>?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handledeleteSubTask}
                  className="confirm-btn"
                >
                  Tak
                </button>
                <button 
                  onClick={canceldeleteSubTask}
                  className="cancel-btn"
                >
                  Nie
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete user confirmation dialog */}
        {showUserDeleteConfirmation && userToDelete && (
          <div className="delete-confirmation-overlay">
            <div className="delete-confirmation-dialog">
              <h4>Potwierdź usunięcie</h4>
              <p>Czy na pewno chcesz usunąć użytkownika: <strong>{userToDelete.name}</strong> z tego zadania?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handleRemoveUser}
                  className="confirm-btn"
                >
                  Tak
                </button>
                <button 
                  onClick={cancelRemoveUser}
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