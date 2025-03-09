document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const addUserBtn = document.getElementById('addUserBtn');
    const usersList = document.querySelector('.users-list');
    const userSearch = document.getElementById('userSearch');

    // Obsługa modali
    const editUserModal = document.getElementById('editUserModal');
    const assignTasksModal = document.getElementById('assignTasksModal');
    const closeBtns = document.querySelectorAll('.close-modal');

    // Elementy formularza edycji
    const editUserForm = document.getElementById('editUserForm');
    const editUserId = document.getElementById('editUserId');
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editPassword = document.getElementById('editPassword');

    // Elementy przypisywania zadań
    const assignToUser = document.getElementById('assignToUser');
    const availableTasks = document.getElementById('availableTasks');
    const saveAssignments = document.getElementById('saveAssignments');

    // Dane użytkowników i zadań
    let users = [];
    let tasks = [];
    let selectedUserId = null;
    let selectedTasks = [];

    // Wczytaj dane przy starcie
    loadUsers();

    // Dodaj nowego użytkownika
    addUserBtn.addEventListener('click', addUser);

    // Zamykanie modali
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            editUserModal.style.display = 'none';
            assignTasksModal.style.display = 'none';
        });
    });

    // Kliknięcie poza modalem
    window.addEventListener('click', function(event) {
        if (event.target === editUserModal) {
            editUserModal.style.display = 'none';
        }
        if (event.target === assignTasksModal) {
            assignTasksModal.style.display = 'none';
        }
    });

    // Obsługa formularza edycji
    editUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateUser();
    });

    // Obsługa zapisywania przypisań zadań
    saveAssignments.addEventListener('click', saveTaskAssignments);

    // Obsługa wyszukiwania użytkowników
    userSearch.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        const userCards = usersList.querySelectorAll('.user-card');

        userCards.forEach(card => {
            const userName = card.querySelector('.user-name').textContent.toLowerCase();
            const userEmail = card.querySelector('.user-email').textContent.toLowerCase();

            if (userName.includes(searchText) || userEmail.includes(searchText)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // Funkcja pobierająca użytkowników z backendu
    function loadUsers() {
        fetch('/users')
            .then(response => response.json())
            .then(data => {
                users = data;
                renderUsers();
            })
            .catch(error => {
                console.error('Błąd podczas pobierania użytkowników:', error);
            });
    }

    // Funkcja pobierająca zadania z backendu
    function loadTasks() {
        fetch('/tasks')
            .then(response => response.json())
            .then(data => {
                tasks = data;
            })
            .catch(error => {
                console.error('Błąd podczas pobierania zadań:', error);
            });
    }

    // Funkcja renderująca listę użytkowników
    function renderUsers() {
        usersList.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';

            userCard.innerHTML = `
                <div class="user-info">
                    <h3 class="user-name">${user.name || 'Brak nazwy'}</h3>
                    <p class="user-email">${user.email || 'Brak email'}</p>
                    <p class="user-tasks">Przypisane zadania: ${user.tasks ? user.tasks.length : 0}</p>
                </div>
                <div class="user-actions">
                    <button class="edit-user-btn" data-id="${user.id}">Edytuj</button>
                    <button class="assign-tasks-btn" data-id="${user.id}" data-name="${user.name || 'Użytkownik'}">Przypisz zadania</button>
                    <button class="delete-user-btn" data-id="${user.id}">Usuń</button>
                </div>
            `;
            usersList.appendChild(userCard);
        });

        // Dodaj event listenery do przycisków akcji
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openEditModal(this.dataset.id);
            });
        });

        document.querySelectorAll('.assign-tasks-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openAssignTasksModal(this.dataset.id, this.dataset.name);
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteUser(this.dataset.id);
            });
        });
    }

    // Funkcja dodająca nowego użytkownika
    function addUser() {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !email || !password) {
            alert('Wypełnij wszystkie pola!');
            return;
        }

        const newUser = {
            name: name,
            email: email,
            password: password
        };

        fetch('/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas dodawania użytkownika');
                }
                return response.json();
            })
            .then(data => {
                // Wyczyść formularz
                nameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';

                // Odśwież listę użytkowników
                loadUsers();
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas dodawania użytkownika');
            });
    }

    // Funkcja otwierająca modal edycji użytkownika
    function openEditModal(userId) {
        const user = users.find(u => u.id == userId);
        if (!user) return;

        editUserId.value = user.id;
        editName.value = user.name || '';
        editEmail.value = user.email || '';
        editPassword.value = '';

        editUserModal.style.display = 'block';
    }

    // Funkcja aktualizująca użytkownika
    function updateUser() {
        const userId = editUserId.value;
        const name = editName.value.trim();
        const email = editEmail.value.trim();
        const password = editPassword.value.trim();

        if (!name || !email) {
            alert('Nazwa i email są wymagane!');
            return;
        }

        const updatedUser = {
            name: name,
            email: email
        };

        // Dodaj hasło tylko jeśli zostało wprowadzone nowe
        if (password) {
            updatedUser.password = password;
        }

        fetch(`/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas aktualizacji użytkownika');
                }
                return response.json();
            })
            .then(data => {
                // Zamknij modal
                editUserModal.style.display = 'none';

                // Odśwież listę użytkowników
                loadUsers();
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas aktualizacji użytkownika');
            });
    }

    // Funkcja usuwająca użytkownika
    function deleteUser(userId) {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            fetch(`/users/${userId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok && response.status !== 404) {
                        throw new Error('Błąd podczas usuwania użytkownika');
                    }

                    // Odśwież listę użytkowników
                    loadUsers();
                })
                .catch(error => {
                    console.error('Błąd:', error);
                    alert('Wystąpił błąd podczas usuwania użytkownika');
                });
        }
    }

    // Funkcja otwierająca modal przypisywania zadań
    function openAssignTasksModal(userId, userName) {
        selectedUserId = userId;
        assignToUser.textContent = userName;

        console.log(`Otwieranie modalu przypisywania zadań dla użytkownika ${userId} (${userName})`);

        // Pobierz wszystkie zadania i zadania przypisane do użytkownika
        Promise.all([
            fetch('/tasks').then(res => {
                if (!res.ok) throw new Error('Błąd podczas pobierania zadań');
                return res.json();
            }),
            fetch(`/users/${userId}`).then(res => {
                if (!res.ok) throw new Error(`Błąd podczas pobierania użytkownika ${userId}`);
                return res.json();
            })
        ])
            .then(([allTasks, user]) => {
                tasks = allTasks;
                console.log("Wszystkie zadania:", tasks);
                console.log("Dane użytkownika:", user);

                // Przygotuj listę zadań z zaznaczeniem tych, które są już przypisane
                availableTasks.innerHTML = '';
                selectedTasks = [];

                // Sprawdź, czy użytkownik ma przypisane zadania
                const userTaskIds = [];
                if (user.tasks && Array.isArray(user.tasks)) {
                    user.tasks.forEach(task => {
                        if (task && task.id) {
                            userTaskIds.push(task.id);
                        }
                    });
                }
                console.log("ID zadań użytkownika:", userTaskIds);

                tasks.forEach(task => {
                    const isAssigned = userTaskIds.includes(task.id);
                    if (isAssigned) {
                        selectedTasks.push(task.id);
                    }

                    const taskElement = document.createElement('div');
                    taskElement.className = 'task-item';

                    taskElement.innerHTML = `
                <label class="task-checkbox">
                    <input type="checkbox" data-id="${task.id}" ${isAssigned ? 'checked' : ''}>
                    <span class="task-title">${task.title}</span>
                </label>
            `;

                    availableTasks.appendChild(taskElement);
                });

                // Dodaj event listenery do checkboxów
                document.querySelectorAll('.task-checkbox input').forEach(checkbox => {
                    checkbox.addEventListener('change', function() {
                        const taskId = parseInt(this.dataset.id);

                        if (this.checked) {
                            if (!selectedTasks.includes(taskId)) {
                                selectedTasks.push(taskId);
                                console.log(`Dodano zadanie ${taskId} do wybranych`);
                            }
                        } else {
                            const index = selectedTasks.indexOf(taskId);
                            if (index !== -1) {
                                selectedTasks.splice(index, 1);
                                console.log(`Usunięto zadanie ${taskId} z wybranych`);
                            }
                        }
                    });
                });

                assignTasksModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Błąd podczas pobierania danych:', error);
                alert('Wystąpił błąd podczas pobierania zadań: ' + error.message);
            });
    }

    function saveTaskAssignments() {
        if (!selectedUserId) return;

        // Utworzenie masy asynchronicznych operacji do przypisania/usunięcia zadań
        const assignPromises = [];

        tasks.forEach(task => {
            const isSelected = selectedTasks.includes(task.id);

            // Sprawdzamy, czy zadanie ma już przypisanego użytkownika
            const currentlyAssigned = task.user && task.user.id == selectedUserId;

            // Aktualizujemy tylko jeśli stan przypisania się zmienił
            if (currentlyAssigned !== isSelected) {
                // Tworzymy obiekt zgodny z oczekiwaniami backendu
                const updatedTask = {
                    user: isSelected ? { id: parseInt(selectedUserId) } : null
                };

                console.log(`Aktualizuję zadanie ${task.id}, przypisanie:`, updatedTask);

                assignPromises.push(
                    fetch(`/tasks/${task.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updatedTask)
                    })
                        .then(response => {
                            if (!response.ok) {
                                return response.text().then(text => {
                                    console.error("Treść błędu:", text);
                                    throw new Error(`Błąd podczas aktualizacji zadania ${task.id}: ${response.status}`);
                                });
                            }
                            return response.json();
                        })
                        .catch(error => {
                            console.error(`Błąd dla zadania ${task.id}:`, error);
                            throw error;
                        })
                );
            }
        });

        if (assignPromises.length === 0) {
            console.log("Brak zadań do aktualizacji");
            assignTasksModal.style.display = 'none';
            return;
        }

        Promise.all(assignPromises)
            .then(results => {
                console.log("Wszystkie zadania zaktualizowane pomyślnie", results);
                assignTasksModal.style.display = 'none';
                loadUsers();
            })
            .catch(error => {
                console.error('Błąd podczas zapisywania przypisań:', error);
                alert('Wystąpił błąd podczas zapisywania przypisań zadań: ' + error.message);
            });
    }

// Załaduj również zadania przy starcie
    loadTasks();
});
