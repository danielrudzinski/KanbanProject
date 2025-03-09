document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const userForm = document.getElementById('userForm');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userPassword = document.getElementById('userPassword');
    const userList = document.getElementById('userList');
    const taskSelect = document.getElementById('taskSelect');
    const userSelect = document.getElementById('userSelect');
    const assignTaskBtn = document.getElementById('assignTaskBtn');
    const assignmentsList = document.getElementById('assignmentsList');

    // Załaduj dane przy starcie
    loadUsers();
    loadTasks();
    loadAssignments();

    // Obsługa formularza dodawania użytkownika
    userForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addUser();
    });

    // Obsługa przypisywania zadań
    assignTaskBtn.addEventListener('click', assignTask);

    // Funkcja dodająca nowego użytkownika
    function addUser() {
        const name = userName.value.trim();
        const email = userEmail.value.trim();
        const password = userPassword.value.trim();

        if (!name || !email || !password) {
            alert('Wypełnij wszystkie pola formularza!');
            return;
        }

        // Przygotuj dane do wysłania
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
                // Wyczyść formularz
                userName.value = '';
                userEmail.value = '';
                userPassword.value = '';

                // Odśwież listę użytkowników
                loadUsers();

                // Dodaj nowego użytkownika do listy rozwijanej
                addUserToSelect(newUser);
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas dodawania użytkownika');
            });
    }

    // Funkcja ładująca użytkowników z backendu
    function loadUsers() {
        fetch('/users')
            .then(response => response.json())
            .then(users => {
                // Wyczyść listę użytkowników
                userList.innerHTML = '';
                userSelect.innerHTML = '<option value="">-- Wybierz użytkownika --</option>';

                // Dodaj użytkowników do listy i do rozwijanej listy
                users.forEach(user => {
                    addUserToList(user);
                    addUserToSelect(user);
                });
            })
            .catch(error => {
                console.error('Błąd podczas pobierania użytkowników:', error);
            });
    }

    // Funkcja dodająca użytkownika do listy
    function addUserToList(user) {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.dataset.userId = user.id;

        userItem.innerHTML = `
            <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
            </div>
            <div class="user-actions">
                <button class="delete-btn" onclick="deleteUser(${user.id})">×</button>
            </div>
        `;

        userList.appendChild(userItem);
    }

    // Funkcja dodająca użytkownika do rozwijanej listy
    function addUserToSelect(user) {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userSelect.appendChild(option);
    }

    // Funkcja ładująca zadania z backendu
    function loadTasks() {
        fetch('/tasks')
            .then(response => response.json())
            .then(tasks => {
                // Wyczyść listę zadań
                taskSelect.innerHTML = '<option value="">-- Wybierz zadanie --</option>';

                // Dodaj zadania do rozwijanej listy
                tasks.forEach(task => {
                    const option = document.createElement('option');
                    option.value = task.id;
                    option.textContent = task.title;
                    taskSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Błąd podczas pobierania zadań:', error);
            });
    }

    // Funkcja przypisująca zadanie do użytkownika
    function assignTask() {
        const taskId = taskSelect.value;
        const userId = userSelect.value;

        if (!taskId || !userId) {
            alert('Wybierz zadanie i użytkownika!');
            return;
        }

        // Przygotuj dane do wysłania
        const assignmentData = {
            user: {
                id: userId
            }
        };

        // Wyślij żądanie do backendu
        fetch(`/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas przypisywania zadania');
                }
                return response.json();
            })
            .then(updatedTask => {
                // Odśwież listę przypisań
                loadAssignments();

                // Wyczyść wybrane opcje
                taskSelect.value = '';
                userSelect.value = '';
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas przypisywania zadania');
            });
    }

    // Funkcja ładująca przypisania zadań
    function loadAssignments() {
        fetch('/tasks')
            .then(response => response.json())
            .then(tasks => {
                // Wyczyść listę przypisań
                assignmentsList.innerHTML = '';

                // Filtruj zadania, które mają przypisanego użytkownika
                const assignedTasks = tasks.filter(task => task.user);

                if (assignedTasks.length === 0) {
                    assignmentsList.innerHTML = '<div class="no-assignments">Brak przypisanych zadań</div>';
                    return;
                }

                // Dodaj przypisania do listy
                assignedTasks.forEach(task => {
                    const assignmentItem = document.createElement('div');
                    assignmentItem.className = 'assignment-item';
                    assignmentItem.dataset.taskId = task.id;

                    assignmentItem.innerHTML = `
                    <div class="assignment-info">
                        <div class="task-title">${task.title}</div>
                        <div class="assigned-to">Przypisane do: ${task.user.name}</div>
                    </div>
                    <div class="assignment-actions">
                        <button class="delete-btn" onclick="removeAssignment(${task.id})">×</button>
                    </div>
                `;

                    assignmentsList.appendChild(assignmentItem);
                });
            })
            .catch(error => {
                console.error('Błąd podczas pobierania przypisań:', error);
            });
    }

    // Dodaj funkcje globalne do usuwania użytkownika i przypisania
    window.deleteUser = function(userId) {
        if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
            fetch(`/users/${userId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok && response.status !== 404) {
                        throw new Error('Błąd podczas usuwania użytkownika');
                    }

                    // Usuń użytkownika z listy
                    const userItem = document.querySelector(`.user-item[data-user-id="${userId}"]`);
                    if (userItem) {
                        userItem.remove();
                    }

                    // Usuń użytkownika z rozwijanej listy
                    const userOption = document.querySelector(`#userSelect option[value="${userId}"]`);
                    if (userOption) {
                        userOption.remove();
                    }

                    // Odśwież listę przypisań
                    loadAssignments();
                })
                .catch(error => {
                    console.error('Błąd:', error);
                    alert('Wystąpił błąd podczas usuwania użytkownika');
                });
        }
    };

    window.removeAssignment = function(taskId) {
        if (confirm('Czy na pewno chcesz usunąć to przypisanie?')) {
            // Przygotuj dane do wysłania (null jako użytkownik)
            const assignmentData = {
                user: null
            };

            fetch(`/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(assignmentData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Błąd podczas usuwania przypisania');
                    }
                    return response.text(); // Zmiana z response.json() na response.text()
                })
                .then(text => {
                    // Sprawdź, czy odpowiedź nie jest pusta
                    if (text) {
                        try {
                            // Próbuj sparsować JSON tylko jeśli jest niepusty
                            JSON.parse(text);
                        } catch (e) {
                            console.error('Błąd parsowania JSON:', e, text);
                        }
                    }

                    // Usuń przypisanie z listy
                    const assignmentItem = document.querySelector(`.assignment-item[data-task-id="${taskId}"]`);
                    if (assignmentItem) {
                        assignmentItem.remove();
                    }

                    // Jeśli nie ma więcej przypisań, wyświetl komunikat
                    if (assignmentsList.children.length === 0) {
                        assignmentsList.innerHTML = '<div class="no-assignments">Brak przypisanych zadań</div>';
                    }
                })
                .catch(error => {
                    console.error('Błąd:', error);
                    alert('Wystąpił błąd podczas usuwania przypisania');
                });
        }
    };

});
