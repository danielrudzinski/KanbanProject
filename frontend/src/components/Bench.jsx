import { useState, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import { fetchUsers, getUserAvatar } from '../services/api';
import '../styles/components/Bench.css';

function Bench() {
  const { refreshTasks } = useKanban();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avatarPreviews, setAvatarPreviews] = useState({});

  const loadUsers = async () => {
    try {
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      
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
    
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      Object.values(avatarPreviews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Bench;