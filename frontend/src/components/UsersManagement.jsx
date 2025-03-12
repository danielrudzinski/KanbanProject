import { useState, useEffect } from 'react';
import '../styles/components/users.css';

function UsersManagement() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  // Function to load users from backend
  const loadUsers = () => {
    fetch('/users')
      .then(response => response.json())
      .then(data => {
        setUsers(data);
      })
      .catch(error => {
        console.error('Błąd podczas ładowania użytkowników:', error);
      });
  };

  // Function to add a new user
  const addUser = () => {
    // Validate input
    if (name.trim() === '' || email.trim() === '' || password.trim() === '') {
      alert('Proszę wypełnić wszystkie pola!');
      return;
    }

    // Validate email
    if (!isValidEmail(email)) {
      alert('Proszę podać poprawny adres email!');
      return;
    }

    // Prepare user data
    const userData = {
      name: name,
      email: email,
      password: password
    };

    // Send request to backend
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
        // Add new user to the list
        setUsers([...users, newUser]);

        // Clear form fields
        setName('');
        setEmail('');
        setPassword('');
      })
      .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas dodawania użytkownika');
      });
  };

  // Function to delete user
  const deleteUser = (userId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      // Send delete request to backend
      fetch(`/users/${userId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (response.ok || response.status === 404) {
            // Remove user from state
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

  // Function to handle Enter key
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

  // Email validation function
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
          <span className="user-id">ID</span>
          <span className="user-name">Imię i nazwisko</span>
          <span className="user-email">Email</span>
          <span className="user-actions">Akcje</span>
        </div>
        <div id="usersList" className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item" data-user-id={user.id}>
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