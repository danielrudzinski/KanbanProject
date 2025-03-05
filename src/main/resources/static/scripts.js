document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const columns = document.querySelectorAll('.column');
    const wipLimitInput = document.getElementById('wipLimit');
    const updateWipBtn = document.getElementById('updateWipBtn');

    // Mapowanie identyfikatorów kolumn na ID z backendu
    let columnMap = {};

    // Pobierz dane z backendu przy starcie
    loadDataFromBackend();

    // Dodaj nowe zadanie
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Aktualizacja limitu WIP
    updateWipBtn.addEventListener('click', updateWipLimit);

    // Funkcja ładująca dane z backendu
    function loadDataFromBackend() {
        // Pobierz kolumny
        fetch('/columns')
            .then(response => response.json())
            .then(columns => {
                // Zapisz mapowanie kolumn
                mapColumnsToFrontend(columns);

                // Wyczyść istniejące zadania
                document.querySelectorAll('.task-list').forEach(list => {
                    list.innerHTML = '';
                });

                // Dodaj zadania z backendu do odpowiednich kolumn
                return fetch('/tasks');
            })
            .then(response => response.json())
            .then(tasks => {
                addTasksFromBackend(tasks);
                updateTaskCounts();
                checkWipLimit();
            })
            .catch(error => {
                console.error('Błąd podczas ładowania danych:', error);
            });
    }

    // Funkcja mapująca kolumny z backendu do frontendu
    function mapColumnsToFrontend(backendColumns) {
        // Domyślne mapowanie (możesz dostosować według swoich potrzeb)
        const defaultMapping = {
            'requested': 'Requested',
            'in-progress': 'In Progress',
            'done': 'Done',
            'expedite': 'Expedite'
        };

        backendColumns.forEach(column => {
            for (const [frontendId, expectedName] of Object.entries(defaultMapping)) {
                if (column.name === expectedName) {
                    columnMap[frontendId] = column.id;

                    // Aktualizuj limit WIP jeśli to kolumna "In Progress"
                    if (frontendId === 'in-progress' && column.wipLimit) {
                        const wipLimitElement = document.querySelector('.column[data-column="in-progress"] .wip-limit');
                        wipLimitInput.value = column.wipLimit;
                        wipLimitElement.textContent = `Limit: ${column.wipLimit}`;
                    }
                }
            }
        });
    }

    // Funkcja dodająca zadania z backendu
    function addTasksFromBackend(tasks) {
        tasks.forEach(task => {
            // Znajdź odpowiednią kolumnę dla zadania
            const columnId = getColumnKeyById(task.columnId);
            if (columnId) {
                const columnElement = document.querySelector(`.column[data-column="${columnId}"] .task-list`);
                const taskElement = createTaskElement(task.title, task.id);
                columnElement.appendChild(taskElement);
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

    function updateWipLimit() {
        const newLimit = parseInt(wipLimitInput.value);
        if (newLimit && newLimit > 0) {
            // Aktualizuj tekst limitu w UI
            const wipLimitElement = document.querySelector('.column[data-column="in-progress"] .wip-limit');
            wipLimitElement.textContent = `Limit: ${newLimit}`;

            // Zaktualizuj limit w backendzie
            const inProgressColumnId = columnMap['in-progress'];
            if (inProgressColumnId) {
                fetch(`/columns/${inProgressColumnId}`, {
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
                            console.error('Błąd podczas aktualizacji limitu WIP');
                        }
                        checkWipLimit();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                    });
            }
        }
    }

    // Funkcja dodająca nowe zadanie
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        // Dodaj zadanie do backendu
        const requestedColumnId = columnMap['requested'];

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
                checkWipLimit();
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
        task.dataset.taskId = taskId; // Zapisz ID zadania z backendu jako atrybut

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Usuń zadanie';
        deleteBtn.addEventListener('click', function(e) {
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
                            checkWipLimit();
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
        task.addEventListener('dragstart', function() {
            this.classList.add('dragging');
        });

        task.addEventListener('dragend', function() {
            this.classList.remove('dragging');

            // Pobierz nową kolumnę i zaktualizuj w backendzie
            const newColumn = this.closest('.column');
            if (newColumn) {
                const columnType = newColumn.dataset.column;
                const backendColumnId = columnMap[columnType];

                // Aktualizuj zadanie w backendzie
                fetch(`/tasks/${this.dataset.taskId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        column: {
                            id: backendColumnId
                        }
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Błąd podczas aktualizacji zadania');
                            // Możesz tutaj dodać logikę przywracania zadania do poprzedniej kolumny w przypadku błędu
                        }
                        updateTaskCounts();
                        checkWipLimit();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                    });
            }
        });

        return task;
    }

    // Obsługa przeciągania nad kolumnami
    columns.forEach(column => {
        const taskList = column.querySelector('.task-list');

        column.addEventListener('dragover', function(e) {
            e.preventDefault();
            const draggingTask = document.querySelector('.dragging');
            if (!draggingTask) return;

            const afterElement = getDragAfterElement(taskList, e.clientY);
            if (afterElement) {
                taskList.insertBefore(draggingTask, afterElement);
            } else {
                taskList.appendChild(draggingTask);
            }
        });
    });

    // Funkcja określająca, gdzie wstawić przeciągane zadanie
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Funkcja aktualizująca liczniki zadań
    function updateTaskCounts() {
        columns.forEach(column => {
            const count = column.querySelectorAll('.task').length;
            column.querySelector('.task-count').textContent = count;
        });
    }

    // Funkcja sprawdzająca limit WIP
    function checkWipLimit() {
        const inProgressColumn = document.querySelector('.column[data-column="in-progress"]');
        const inProgressCount = inProgressColumn.querySelectorAll('.task').length;
        const wipLimitElement = inProgressColumn.querySelector('.wip-limit');
        const WIP_LIMIT = parseInt(wipLimitInput.value);

        if (inProgressCount > WIP_LIMIT) {
            inProgressColumn.classList.add('over-limit');
            wipLimitElement.classList.add('exceeded');
            wipLimitElement.textContent = `Limit: ${WIP_LIMIT} (przekroczony!)`;
        } else {
            inProgressColumn.classList.remove('over-limit');
            wipLimitElement.classList.remove('exceeded');
            wipLimitElement.textContent = `Limit: ${WIP_LIMIT}`;
        }
    }
});