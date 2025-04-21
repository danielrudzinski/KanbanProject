import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/components/Users.css';

function UsersManagement() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [avatarPreviews, setAvatarPreviews] = useState({});
  const avatarPreviewsRef = useRef({});

  useEffect(() => {
    avatarPreviewsRef.current = avatarPreviews;
  }, [avatarPreviews]);

  const fetchUserAvatar = useCallback(async (userId) => {
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
      console.warn(`Failed to load avatar for user ${userId}:`, error);
      return null;
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
  
      const avatarPromises = data.map(async (user) => {
        const avatarUrl = await fetchUserAvatar(user.id);
        if (avatarUrl) {
          setAvatarPreviews(prev => ({
            ...prev,
            [user.id]: avatarUrl
          }));
        }
      });
  
      await Promise.all(avatarPromises);
    } catch (error) {
      console.error('Błąd podczas ładowania użytkowników:', error);
      alert('Wystąpił błąd podczas ładowania użytkowników');
    }
  }, [fetchUserAvatar]);

  useEffect(() => {
    loadUsers();
    
    return () => {
      Object.values(avatarPreviewsRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [loadUsers]);
  
  const handleAvatarUpload = async (userId, file) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  
    try {
      if (file.size > MAX_FILE_SIZE) {
        alert('Plik jest zbyt duży. Maksymalny rozmiar to 10MB.');
        return;
      }
  
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert('Dozwolone są tylko pliki JPG i PNG.');
        return;
      }
  
      const formData = new FormData();
      formData.append('file', file);
  
      const response = await fetch(`/users/${userId}/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
  
      const responseData = await response.text();
      
      if (!response.ok) {
        throw new Error(responseData || 'Failed to upload avatar');
      }
  
      let retries = 3;
      while (retries > 0) {
        try {
          const avatarResponse = await fetch(`/users/${userId}/avatar`, {
            headers: {
              'Cache-Control': 'no-cache',
              'Accept': 'image/*, application/json'
            }
          });
          
          if (avatarResponse.ok) {
            const blob = await avatarResponse.blob();
            if (avatarPreviews[userId]) {
              URL.revokeObjectURL(avatarPreviews[userId]);
            }
            const imageUrl = URL.createObjectURL(blob);
            setAvatarPreviews(prev => ({
              ...prev,
              [userId]: imageUrl
            }));
            break;
          }
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn('Retry failed:', error);
          retries--;
          if (retries === 0) throw error;
        }
      }
  
      alert('Avatar został pomyślnie zaktualizowany');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Wystąpił błąd podczas uploadu avatara: ${error.message}`);
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
        <input
          type="file"
          id={`avatar-input-${user.id}`}
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleAvatarUpload(user.id, file);
            }
          }}
        />
        <button
          onClick={() => document.getElementById(`avatar-input-${user.id}`).click()}
          className="upload-avatar-btn"
        >
          Zmień
        </button>
      </div>
    );
  };

  const addUser = () => {
    if (name.trim() === '' || email.trim() === '' || password.trim() === '') {
      alert('Proszę wypełnić wszystkie pola!');
      return;
    }

    if (!isValidEmail(email)) {
      alert('Proszę podać poprawny adres email!');
      return;
    }

    const userData = {
      name: name,
      email: email,
      password: password
    };

    fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Błąd podczas dodawania użytkownika');
        }
        return response.json();
      })
      .then(newUser => {
        setUsers([...users, newUser]);
        setName('');
        setEmail('');
        setPassword('');
      })
      .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas dodawania użytkownika');
      });
  };

  const deleteUser = (userId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      fetch(`/users/${userId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (response.ok || response.status === 404) {
            setUsers(users.filter(user => user.id !== userId));
          } else {
            throw new Error('Błąd podczas usuwania użytkownika');
          }
        })
        .catch(error => {
          console.error('Błąd:', error);
          alert('Wystąpił błąd podczas usuwania użytkownika');
        });
    }
  };

  const handleKeyPress = (e, nextField) => {
    if (e.key === 'Enter') {
      if (nextField === 'email') {
        document.getElementById('emailInput').focus();
      } else if (nextField === 'password') {
        document.getElementById('passwordInput').focus();
      } else if (nextField === 'submit') {
        addUser();
      }
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="container">
      <h1>Zarządzanie Użytkownikami</h1>

      <div className="controls">
        <div className="main-controls">
          <input
            type="text"
            id="nameInput"
            placeholder="Imię i nazwisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'email')}
          />
          <input
            type="email"
            id="emailInput"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'password')}
          />
          <input
            type="password"
            id="passwordInput"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'submit')}
          />
          <button id="addUserBtn" onClick={addUser}>
            Dodaj Użytkownika
          </button>
        </div>
      </div>

      <div className="users-container">
        <div className="users-header">
          <span className="user-id">Avatar</span>
          <span className="user-id">ID</span>
          <span className="user-name">Imię i nazwisko</span>
          <span className="user-email">Email</span>
          <span className="user-actions">Akcje</span>
        </div>
        <div id="usersList" className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item" data-user-id={user.id}>
              {renderUserAvatar(user)}
              <span className="user-id">{user.id}</span>
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
              <span className="user-actions">
                <button
                  className="delete-user-btn"
                  title="Usuń użytkownika"
                  onClick={() => deleteUser(user.id)}
                >
                  ×
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation">
        <a href="/" className="back-btn">Powrót do Tablicy Kanban</a>
      </div>
    </div>
  );
}

export default UsersManagement;