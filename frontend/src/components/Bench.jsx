import React, { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import { fetchUsers, getUserAvatar, updateUserWipLimit } from '../services/api';
import '../styles/components/Bench.css';

function Bench() {
  const { refreshTasks } = useKanban();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarPreviews, setAvatarPreviews] = useState({});
  const [editingWipLimit, setEditingWipLimit] = useState({});
  const [wipLimits, setWipLimits] = useState({});

  const loadUsers = async () => {
    try {
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      
      // Initialize WIP limits from data, default to Unlimited (null)
      const initialWipLimits = {};
      allUsers.forEach(user => {
        initialWipLimits[user.id] = user.wipLimit || null; 
      });
      setWipLimits(initialWipLimits);
      
      // Load avatars for all users
      const avatarPromises = allUsers.map(async (user) => {
        try {
          const avatarUrl = await getUserAvatar(user.id);
          if (avatarUrl) {
            setAvatarPreviews(prev => ({
              ...prev,
              [user.id]: avatarUrl
            }));
          }
        } catch (avatarError) {
          console.error(`Error loading avatar for user ${user.id}:`, avatarError);
        }
      });
      
      await Promise.all(avatarPromises);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Wystąpił błąd podczas ładowania użytkowników');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(avatarPreviews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [avatarPreviews]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleDragStart = (e, userId) => {
    e.dataTransfer.setData('application/user', JSON.stringify({ 
      userId: userId,
      type: 'user'
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Start editing WIP limit
  const startEditWipLimit = (userId) => {
    setEditingWipLimit({
      ...editingWipLimit,
      [userId]: true
    });
  };

  // Handle WIP limit change
  const handleWipLimitChange = (userId, value) => {
    // Allow setting to null (Unlimited) or a positive number
    setWipLimits({
      ...wipLimits,
      [userId]: value === '' ? null : parseInt(value)
    });
  };

  // Save WIP limit to backend
  const saveWipLimit = async (userId) => {
    try {
      const newLimit = wipLimits[userId];
      await updateUserWipLimit(userId, newLimit);
      
      // Update local user data
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, wipLimit: newLimit } : user
        )
      );
      
      // Exit edit mode
      setEditingWipLimit({
        ...editingWipLimit,
        [userId]: false
      });
      
      // Refresh tasks to update UI
      refreshTasks();
    } catch (error) {
      console.error('Error updating WIP limit:', error);
    }
  };

  // Cancel editing
  const cancelEditWipLimit = (userId) => {
    // Reset to original value
    setWipLimits({
      ...wipLimits,
      [userId]: users.find(u => u.id === userId).wipLimit || null
    });
    
    // Exit edit mode
    setEditingWipLimit({
      ...editingWipLimit,
      [userId]: false
    });
  };

  if (loading) {
    return (
        <div className={`bench-container ${isOpen ? 'open' : ''}`}>
        <button className="bench-toggle" onClick={handleToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
        <div className="bench">
          <h3>Zespół</h3>
          <div className="loading">Ładowanie...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className={`bench-container ${isOpen ? 'open' : ''}`}>
        <button className="bench-toggle" onClick={handleToggle}>
          {isOpen ? '◀' : '▶'}
        </button>
        <div className="bench">
          <h3>Zespół</h3>
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bench-container ${isOpen ? 'open' : ''}`}>
      <button className="bench-toggle" onClick={handleToggle}>
        {isOpen ? '◀' : '▶'}
      </button>
      <div className="bench">
        <h3>Zespół</h3>
        <div className="user-list">
          {users.map(user => (
            <div 
              key={user.id} 
              className="user-card"
              draggable="true"
              onDragStart={(e) => handleDragStart(e, user.id)}
            >
              <div className="user-avatar">
                <img 
                  src={avatarPreviews[user.id] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E'} 
                  alt={`${user.name} avatar`}
                  className="avatar"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                {user.role && <div className="user-role">{user.role}</div>}
                <div className="user-wip-limit">
                  {editingWipLimit[user.id] ? (
                    <div className="wip-limit-editor">
                      <input 
                        type="number" 
                        min="1"
                        value={wipLimits[user.id] || ''} 
                        placeholder="Unlimited"
                        onChange={(e) => handleWipLimitChange(user.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button 
                        className="save-wip-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          saveWipLimit(user.id);
                        }}
                        title="Zapisz limit WIP"
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-wip-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditWipLimit(user.id);
                        }}
                        title="Anuluj"
                      >
                        ✗
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="wip-limit-display"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditWipLimit(user.id);
                      }}
                    >
                      <span>WIP Limit: {user.wipLimit ? user.wipLimit : 'Unlimited'}</span>
                      <button 
                        className="edit-wip-btn" 
                        title="Edytuj limit WIP"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>
                {user.taskCount && (
                  <div className={`user-task-count ${(user.taskCount >= (user.wipLimit || Infinity)) ? 'limit-reached' : ''}`}>
                    Zadania: {user.taskCount}/{user.wipLimit || 'Unlimited'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Bench;