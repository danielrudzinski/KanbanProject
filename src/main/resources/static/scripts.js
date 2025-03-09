document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const board = document.querySelector('.board');
    const wipLimitInput = document.getElementById('wipLimit');
    const updateWipBtn = document.getElementById('updateWipBtn');
    const columnInput = document.getElementById('columnInput');
    const columnWipLimitInput = document.getElementById('columnWipLimit');
    const addColumnBtn = document.getElementById('addColumnBtn');

    // Mapowanie identyfikatorów kolumn na ID z backendu
    let columnMap = {};

    // Przechowuje dane kolumny "requested" do dodawania nowych zadań
    let requestedColumnId = null;

    // Pobierz dane z backendu przy starcie
    loadDataFromBackend();

    // Dodaj nowe zadanie
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Aktualizacja limitu WIP dla kolumny "In Progress"
    updateWipBtn.addEventListener('click', function () {
        const inProgressColumnId = columnMap['in-progress'];
        if (inProgressColumnId) {
            updateWipLimit(inProgressColumnId, parseInt(wipLimitInput.value));
        }
    });

    // Dodaj nową kolumnę
    addColumnBtn.addEventListener('click', addColumn);
    columnInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addColumn();
        }
    });

    // Funkcja do dynamicznego tworzenia kolumny
    function createColumnElement(columnData) {
        const columnId = columnData.id;
        const columnName = columnData.name;
        const wipLimit = columnData.wipLimit || 0;

        // Utwórz identyfikator dla frontendu
        const columnKey = columnName.toLowerCase().replace(/\s+/g, '-');

        // Zapisz mapowanie
        columnMap[columnKey] = columnId;

        // Jeśli to kolumna "Requested", zapisz jej ID do globalnej zmiennej
        if (columnName === 'Requested') {
            requestedColumnId = columnId;
        }

        // Jeśli to kolumna "In Progress", zaktualizuj wartość w polu input
        if (columnName === 'In Progress') {
            wipLimitInput.value = wipLimit;
        }

        // Utwórz element kolumny
        const column = document.createElement('div');
        column.className = 'column';
        column.dataset.column = columnKey;
        column.dataset.columnId = columnId;

        const columnHeader = document.createElement('div');
        columnHeader.className = 'column-header';

        const headerTop = document.createElement('div');
        headerTop.className = 'header-top';

        // Dodaj licznik zadań
        const taskCount = document.createElement('span');
        taskCount.className = 'task-count';
        taskCount.textContent = '0';

        headerTop.innerHTML = `${columnName} `;
        headerTop.appendChild(taskCount);

        // Dodaj przycisk usuwania kolumny
        const deleteColumnBtn = document.createElement('button');
        deleteColumnBtn.className = 'delete-column-btn';
        deleteColumnBtn.innerHTML = '×';
        deleteColumnBtn.title = 'Usuń kolumnę';
        deleteColumnBtn.addEventListener('click', function () {
            deleteColumn(columnId, column);
        });

        columnHeader.appendChild(headerTop);
        columnHeader.appendChild(deleteColumnBtn);

        // Dodaj element limitu WIP, jeśli kolumna ma limit
        if (wipLimit > 0) {
            const wipLimitElement = document.createElement('span');
            wipLimitElement.className = 'wip-limit';
            wipLimitElement.textContent = `Limit: ${wipLimit}`;
            columnHeader.appendChild(wipLimitElement);
        }

        const taskList = document.createElement('div');
        taskList.className = 'task-list';

        column.appendChild(columnHeader);
        column.appendChild(taskList);

        // Dodaj obsługę przeciągania
        column.addEventListener('dragover', function (e) {
            e.preventDefault();
            const draggingTask = document.querySelector('.dragging');
            if (!draggingTask) return;

            const taskList = this.querySelector('.task-list');
            const afterElement = getDragAfterElement(taskList, e.clientY);

            if (afterElement) {
                taskList.insertBefore(draggingTask, afterElement);
            } else {
                taskList.appendChild(draggingTask);
            }
        });

        return column;
    }

    // Funkcja usuwania kolumny
    function deleteColumn(columnId, columnElement) {
        if (confirm('Czy na pewno chcesz usunąć tę kolumnę?')) {
            // Pobierz wszystkie zadania z kolumny
            const tasks = columnElement.querySelectorAll('.task');
            const firstColumn = document.querySelector('.column:first-child');

            // Jeśli to jedyna kolumna, wyświetl komunikat
            if (document.querySelectorAll('.column').length <= 1) {
                alert('Nie można usunąć ostatniej kolumny.');
                return;
            }

            // Wyślij żądanie usunięcia kolumny do backendu
            fetch(`/columns/${columnId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok || response.status === 404) {
                        // Przenieś zadania do pierwszej kolumny (lub innej dostępnej)
                        if (tasks.length > 0 && firstColumn && firstColumn !== columnElement) {
                            const targetTaskList = firstColumn.querySelector('.task-list');
                            tasks.forEach(task => {
                                // Zaktualizuj zadanie w backendzie
                                const taskId = task.dataset.taskId;
                                const targetColumnId = firstColumn.dataset.columnId;

                                fetch(`/tasks/${taskId}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        column: {
                                            id: targetColumnId
                                        }
                                    })
                                });

                                targetTaskList.appendChild(task);
                            });
                        }

                        // Usuń kolumnę z UI
                        columnElement.remove();

                        // Usuń mapowanie kolumny
                        for (const [key, value] of Object.entries(columnMap)) {
                            if (value === columnId) {
                                delete columnMap[key];
                                break;
                            }
                        }

                        // Jeśli usunięto kolumnę "Requested", zresetuj jej ID
                        if (columnId === requestedColumnId) {
                            requestedColumnId = null;
                        }

                        updateTaskCounts();
                        checkWipLimits();
                    } else {
                        console.error('Błąd podczas usuwania kolumny');
                    }
                })
                .catch(error => {
                    console.error('Błąd:', error);
                });
        }
    }

    // Funkcja ładująca dane z backendu
    function loadDataFromBackend() {
        // Pobierz kolumny
        fetch('/columns')
            .then(response => response.json())
            .then(columns => {
                // Wyczyść planszę
                board.innerHTML = '';
                // Wyczyść mapowanie kolumn
                columnMap = {};

                // Sortuj kolumny (Requested, In Progress, Done, pozostałe)
                columns.sort((a, b) => {
                    const order = {
                        'Requested': 0,
                        'In Progress': 1,
                        'Done': 2,
                        'Expedite': 3 // Expedite na początku
                    };
                    const orderA = order[a.name] !== undefined ? order[a.name] : 99;
                    const orderB = order[b.name] !== undefined ? order[b.name] : 99;
                    return orderA - orderB;
                });

                // Utwórz i dodaj kolumny do planszy
                columns.forEach(column => {
                    const columnElement = createColumnElement(column);
                    board.appendChild(columnElement);
                });

                // Pobierz zadania
                return fetch('/tasks');
            })
            .then(response => response.json())
            .then(tasks => {
                addTasksFromBackend(tasks);
                updateTaskCounts();
                checkWipLimits();
            })
            .catch(error => {
                console.error('Błąd podczas ładowania danych:', error);
            });
    }

    // Funkcja dodająca zadania z backendu
    function addTasksFromBackend(tasks) {
        tasks.forEach(task => {
            // Znajdź odpowiednią kolumnę dla zadania
            const columnId = getColumnKeyById(task.columnId);
            if (columnId) {
                const columnElement = document.querySelector(`.column[data-column="${columnId}"] .task-list`);
                if (columnElement) {
                    const taskElement = createTaskElement(task.title, task.id);
                    columnElement.appendChild(taskElement);
                }
            }
        });
    }

    // Funkcja znajdująca klucz kolumny po ID z backendu
    function getColumnKeyById(backendId) {
        for (const [key, value] of Object.entries(columnMap)) {
            if (value === backendId) {
                return key;
            }
        }
        return null;
    }

    // Funkcja aktualizująca limit WIP dla dowolnej kolumny
    function updateWipLimit(columnId, newLimit) {
        if (newLimit && newLimit >= 0) {
            // Wyślij aktualizację do backendu
            fetch(`/columns/${columnId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wipLimit: newLimit
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Błąd podczas aktualizacji limitu WIP');
                    }

                    // Zaktualizuj UI
                    const columnKey = getColumnKeyById(columnId);
                    if (columnKey) {
                        const column = document.querySelector(`.column[data-column="${columnKey}"]`);
                        let wipLimitElement = column.querySelector('.wip-limit');
                        if (!wipLimitElement && newLimit > 0) {
                            // Utwórz element limitu jeśli nie istnieje
                            wipLimitElement = document.createElement('span');
                            wipLimitElement.className = 'wip-limit';
                            column.querySelector('.column-header').appendChild(wipLimitElement);
                        }

                        if (wipLimitElement) {
                            if (newLimit > 0) {
                                wipLimitElement.textContent = `Limit: ${newLimit}`;
                            } else {
                                // Usuń element limitu jeśli limit ustawiono na 0
                                wipLimitElement.remove();
                            }
                        }

                        checkWipLimits();
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }

    // Funkcja dodająca nową kolumnę
    function addColumn() {
        const columnName = columnInput.value.trim();
        const wipLimit = parseInt(columnWipLimitInput.value) || 0;
        if (columnName === '') return;

        // Wyślij żądanie dodania kolumny do backendu
        fetch('/columns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: columnName,
                wipLimit: wipLimit
            })
        })
            .then(response => response.json())
            .then(newColumn => {
                // Utwórz element kolumny i dodaj do planszy
                const columnElement = createColumnElement(newColumn);
                board.appendChild(columnElement);
                // Wyczyść pola wprowadzania
                columnInput.value = '';
                columnWipLimitInput.value = '0';
                updateTaskCounts();
                checkWipLimits();
            })
            .catch(error => {
                console.error('Błąd podczas dodawania kolumny:', error);
            });
    }

    // Funkcja dodająca nowe zadanie
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        // Jeśli nie ma kolumny "Requested", wyświetl komunikat
        if (!requestedColumnId) {
            alert('Brak kolumny "Requested". Dodaj najpierw tę kolumnę.');
            return;
        }

        // Dodaj zadanie do backendu
        fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: taskText,
                column: {
                    id: requestedColumnId
                }
            })
        })
            .then(response => response.json())
            .then(savedTask => {
                const taskElement = createTaskElement(savedTask.title, savedTask.id);
                const firstColumn = document.querySelector('.column[data-column="requested"] .task-list');
                firstColumn.appendChild(taskElement);
                // Wyczyść pole wprowadzania
                taskInput.value = '';
                taskInput.focus();
                // Zaktualizuj liczniki zadań i sprawdź limity
                updateTaskCounts();
                checkWipLimits();
            })
            .catch(error => {
                console.error('Błąd podczas dodawania zadania:', error);
            });
    }

    // Funkcja tworząca element zadania
    function createTaskElement(text, taskId) {
        const task = document.createElement('div');
        task.className = 'task';
        task.draggable = true;
        task.textContent = text;
        task.dataset.taskId = taskId;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Usuń zadanie';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Usuń zadanie z backendu
            fetch(`/tasks/${taskId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok || response.status === 404) {
                        // Animacja usuwania
                        task.style.opacity = '0';
                        task.style.transform = 'translateX(10px)';
                        setTimeout(() => {
                            task.remove();
                            updateTaskCounts();
                            checkWipLimits();
                        }, 200);
                    } else {
                        console.error('Błąd podczas usuwania zadania');
                    }
                })
                .catch(error => {
                    console.error('Błąd:', error);
                });
        });

        task.appendChild(deleteBtn);

        // Dodaj obsługę przeciągania
        task.addEventListener('dragstart', function () {
            this.classList.add('dragging');
        });

        task.addEventListener('dragend', function () {
            this.classList.remove('dragging');
            // Pobierz nową kolumnę i zaktualizuj w backendzie
            const newColumn = this.closest('.column');
            if (newColumn) {
                const columnId = newColumn.dataset.columnId;
                // Aktualizuj zadanie w backendzie
                fetch(`/tasks/${this.dataset.taskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        column: {
                            id: columnId
                        }
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Błąd podczas aktualizacji zadania');
                        }
                        updateTaskCounts();
                        checkWipLimits();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                    });
            }
        });

        return task;
    }

    // Funkcja określająca, gdzie wstawić przeciągane zadanie
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    // Funkcja aktualizująca liczniki zadań
    function updateTaskCounts() {
        document.querySelectorAll('.column').forEach(column => {
            const count = column.querySelectorAll('.task').length;
            const taskCountElement = column.querySelector('.header-top .task-count');
            if (taskCountElement) {
                taskCountElement.textContent = count;
            }
        });
    }

    // Funkcja sprawdzająca limity WIP dla wszystkich kolumn
    function checkWipLimits() {
        document.querySelectorAll('.column').forEach(column => {
            const wipLimitElement = column.querySelector('.wip-limit');
            if (wipLimitElement) {
                const taskCount = column.querySelectorAll('.task').length;
                const limitText = wipLimitElement.textContent;
                const limit = parseInt(limitText.replace('Limit: ', ''));
                if (taskCount > limit) {
                    column.classList.add('over-limit');
                    wipLimitElement.classList.add('exceeded');
                    wipLimitElement.textContent = `Limit: ${limit} (przekroczony!)`;
                } else {
                    column.classList.remove('over-limit');
                    wipLimitElement.classList.remove('exceeded');
                    wipLimitElement.textContent = `Limit: ${limit}`;
                }
            }
        });
    }

    // Funkcja tworząca element zadania
    function createTaskElement(text, taskId) {
        const task = document.createElement('div');
        task.className = 'task';
        task.draggable = true;
        task.textContent = text;
        task.dataset.taskId = taskId;

        // Dodaj obsługę kliknięcia w zadanie
        task.addEventListener('click', function (e) {
            e.stopPropagation();
            showTaskDetails(this);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Usuń zadanie';
        deleteBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // Usuń zadanie z backendu
            fetch(`/tasks/${taskId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (response.ok || response.status === 404) {
                        // Animacja usuwania
                        task.style.opacity = '0';
                        task.style.transform = 'translateX(10px)';
                        setTimeout(() => {
                            task.remove();
                            updateTaskCounts();
                            checkWipLimits();
                        }, 200);
                    } else {
                        console.error('Błąd podczas usuwania zadania');
                    }
                })
                .catch(error => {
                    console.error('Błąd:', error);
                });
        });

        task.appendChild(deleteBtn);

        // Dodaj obsługę przeciągania
        task.addEventListener('dragstart', function () {
            this.classList.add('dragging');
        });

        task.addEventListener('dragend', function () {
            this.classList.remove('dragging');
            // Pobierz nową kolumnę i zaktualizuj w backendzie
            const newColumn = this.closest('.column');
            if (newColumn) {
                const columnId = newColumn.dataset.columnId;
                // Aktualizuj zadanie w backendzie
                fetch(`/tasks/${this.dataset.taskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        column: {
                            id: columnId
                        }
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Błąd podczas aktualizacji zadania');
                        }
                        updateTaskCounts();
                        checkWipLimits();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                    });
            }
        });

        return task;
    }

// Funkcja wyświetlająca szczegóły zadania
    function showTaskDetails(taskElement) {
        // Sprawdź, czy panel szczegółów już istnieje
        const existingPanel = document.getElementById('task-details-panel');

        // Jeśli panel istnieje i należy do tego samego zadania, usuń go (toggle)
        if (existingPanel && existingPanel.dataset.taskId === taskElement.dataset.taskId) {
            existingPanel.remove();
            return;
        }

        // Usuń istniejący panel, jeśli istnieje
        if (existingPanel) {
            existingPanel.remove();
        }

        // Utwórz nowy panel szczegółów
        const detailsPanel = document.createElement('div');
        detailsPanel.id = 'task-details-panel';
        detailsPanel.className = 'task-details-panel';
        detailsPanel.dataset.taskId = taskElement.dataset.taskId;

        // Dodaj nagłówek panelu z tytułem i przyciskiem zamknięcia
        const headerContainer = document.createElement('div');
        headerContainer.className = 'panel-header';

        // Dodaj tytuł zadania
        const title = document.createElement('h3');
        title.textContent = taskElement.textContent.replace('×', '').trim();
        headerContainer.appendChild(title);

        // Dodaj przycisk zamknięcia
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-panel-btn';
        closeBtn.innerHTML = '×';
        closeBtn.title = 'Zamknij panel';
        closeBtn.addEventListener('click', function () {
            detailsPanel.remove();
        });
        headerContainer.appendChild(closeBtn);

        detailsPanel.appendChild(headerContainer);

        // Dodaj sekcję przypisywania użytkowników
        const userSection = document.createElement('div');
        userSection.className = 'user-section';

        const userLabel = document.createElement('label');
        userLabel.textContent = 'Przypisz użytkownika:';
        userSection.appendChild(userLabel);

        // Dodaj dropdown z użytkownikami
        const userSelect = document.createElement('select');
        userSelect.id = 'user-select';

        // Domyślna opcja
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Wybierz użytkownika';
        userSelect.appendChild(defaultOption);

        // Pobierz użytkowników z API
        fetch('/users')
            .then(response => response.json())
            .then(users => {
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    userSelect.appendChild(option);
                });

                // Sprawdź, czy zadanie ma już przypisanego użytkownika
                fetch(`/tasks/${taskElement.dataset.taskId}`)
                    .then(response => response.json())
                    .then(task => {
                        if (task.user && task.user.id) {
                            userSelect.value = task.user.id;
                        }
                    })
                    .catch(error => console.error('Błąd pobierania danych zadania:', error));
            })
            .catch(error => console.error('Błąd pobierania użytkowników:', error));

        userSection.appendChild(userSelect);

        // Dodaj przycisk przypisania
        const assignBtn = document.createElement('button');
        assignBtn.textContent = 'Przypisz';
        assignBtn.addEventListener('click', function () {
            assignUserToTask(userSelect.value, taskElement.dataset.taskId);
        });
        userSection.appendChild(assignBtn);

        detailsPanel.appendChild(userSection);

        // Dodaj panel do body dokumentu
        document.body.appendChild(detailsPanel);

        // Pozycjonuj panel obok zadania
        const taskRect = taskElement.getBoundingClientRect();
        detailsPanel.style.position = 'absolute';
        detailsPanel.style.top = `${taskRect.top}px`;
        detailsPanel.style.left = `${taskRect.right + 10}px`;
        detailsPanel.style.zIndex = '9999';
    }

// Funkcja przypisująca użytkownika do zadania
    function assignUserToTask(userId, taskId) {
        if (!userId) {
            alert('Wybierz użytkownika!');
            return;
        }

        fetch(`/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user: {
                    id: userId
                }
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Błąd podczas przypisywania użytkownika');
                }
                return response.json();
            })
            .then(updatedTask => {
                alert('Użytkownik został przypisany do zadania!');
                // Zamknij panel szczegółów
                document.getElementById('task-details-panel').remove();
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Wystąpił błąd podczas przypisywania użytkownika');
            });
    }
})