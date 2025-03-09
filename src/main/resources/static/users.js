document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const addUserBtn = document.getElementById('addUserBtn');
    const usersList = document.getElementById('usersList');

    // Załaduj użytkowników przy starcie
    loadUsers();

    // Obsługa dodawania użytkownika
    addUserBtn.addEventListener('click', addUser);

    // Obsługa naciśnięcia Enter w polach input
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            emailInput.focus();
        }
    });

    emailInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addUser();
        }
    });

    // Funkcja ładująca użytkowników z backendu
    function loadUsers() {
        fetch('/users')
            .then(response => response.json())
            .then(users => {
                // Wyczyść listę użytkowników
                usersList.innerHTML = '';

                // Dodaj każdego użytkownika do listy
                users.forEach(user => {
                    addUserToList(user);
                });
            })
            .catch(error => {
                console.error('Błąd podczas ładowania użytkowników:', error);
            });
    }

    function addUser() {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Walidacja danych
        if (name === '' || email === '' || password === '') {
            alert('Proszę wypełnić wszystkie pola!');
            return;
        }

        // Walidacja email
        if (!isValidEmail(email)) {
            alert('Proszę podać poprawny adres email!');
            return;
        }

        // Przygotuj dane użytkownika
        const userData = {
            name: name,
            email: email,
            password: password
        };

        // Wyślij żądanie do backendu
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
                // Dodaj nowego użytkownika do listy
                addUserToList(newUser);

                // Wyczyść pola formularza
                nameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
                nameInput.focus();
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas dodawania użytkownika');
            });
    }


    // Funkcja dodająca użytkownika do listy w UI
    function addUserToList(user) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = user.id;

        userItem.innerHTML = `
            <span class="user-id">${user.id}</span>
            <span class="user-name">${user.name}</span>
            <span class="user-email">${user.email}</span>
            <span class="user-actions">
                <button class="delete-user-btn" title="Usuń użytkownika">×</button>
            </span>
        `;

        // Dodaj obsługę usuwania użytkownika
        const deleteBtn = userItem.querySelector('.delete-user-btn');
        deleteBtn.addEventListener('click', function() {
            deleteUser(user.id, userItem);
        });

        // Dodaj element do listy
        usersList.appendChild(userItem);
    }

    // Funkcja usuwająca użytkownika
    function deleteUser(userId, userElement) {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            // Wyślij żądanie usunięcia do backendu
            fetch(`/users/${userId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok || response.status === 404) {
                        // Animacja usuwania
                        userElement.style.opacity = '0';
                        userElement.style.transform = 'translateX(10px)';

                        setTimeout(() => {
                            userElement.remove();
                        }, 300);
                    } else {
                        throw new Error('Błąd podczas usuwania użytkownika');
                    }
                })
                .catch(error => {
                    console.error('Błąd:', error);
                    alert('Wystąpił błąd podczas usuwania użytkownika');
                });
        }
    }

    // Funkcja walidująca email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});
