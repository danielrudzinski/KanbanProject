document.addEventListener('DOMContentLoaded', function() {
    // Pobierz elementy DOM
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const columns = document.querySelectorAll('.column');
    const wipLimitInput = document.getElementById('wipLimit');
    const updateWipBtn = document.getElementById('updateWipBtn');
    
    // Ustaw początkowy limit WIP dla kolumny "In Progress"
    let WIP_LIMIT = 3;
    
    // Dodaj kilka przykładowych zadań na start
    addExampleTasks();
    
    // Dodaj nowe zadanie
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addTask();
      }
    });
    
    // Aktualizacja limitu WIP
    updateWipBtn.addEventListener('click', updateWipLimit);
    
    function updateWipLimit() {
      const newLimit = parseInt(wipLimitInput.value);
      if (newLimit && newLimit > 0) {
        WIP_LIMIT = newLimit;
        
        // Aktualizuj tekst limitu
        const wipLimitElement = document.querySelector('.column[data-column="in-progress"] .wip-limit');
        wipLimitElement.textContent = `Limit: ${WIP_LIMIT}`;
        
        // Sprawdź, czy nowy limit jest przekroczony
        checkWipLimit();
      }
    }
    
    // Funkcja dodająca nowe zadanie
    function addTask() {
      const taskText = taskInput.value.trim();
      if (taskText === '') return;
      
      const taskElement = createTaskElement(taskText);
      const firstColumn = document.querySelector('.column[data-column="requested"] .task-list');
      firstColumn.appendChild(taskElement);
      
      // Wyczyść pole wprowadzania
      taskInput.value = '';
      taskInput.focus();
      
      // Zaktualizuj liczniki zadań i sprawdź limity
      updateTaskCounts();
      checkWipLimit();
    }
    
    // Funkcja tworząca element zadania
    function createTaskElement(text) {
      const task = document.createElement('div');
      task.className = 'task';
      task.draggable = true;
      task.textContent = text;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.title = 'Usuń zadanie';
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Animacja usuwania
        task.style.opacity = '0';
        task.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
          task.remove();
          updateTaskCounts();
          checkWipLimit();
        }, 200);
      });
      
      task.appendChild(deleteBtn);
      
      // Dodaj obsługę przeciągania
      task.addEventListener('dragstart', function() {
        this.classList.add('dragging');
      });
      
      task.addEventListener('dragend', function() {
        this.classList.remove('dragging');
        updateTaskCounts();
        checkWipLimit();
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
        
        updateTaskCounts();
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
    
    // Funkcja dodająca przykładowe zadania
    function addExampleTasks() {
      const examples = {
        "requested": ["Naprawić błąd logowania", "Zaktualizować dokumentację"],
        "in-progress": ["Zaimplementować nową funkcję", "Przeprowadzić testy"],
        "done": ["Zakończyć projekt A"],
        "expedite": ["Naprawić krytyczny błąd serwera"]
      };
      
      Object.keys(examples).forEach(columnId => {
        const column = document.querySelector(`.column[data-column="${columnId}"] .task-list`);
        
        examples[columnId].forEach(taskText => {
          const taskElement = createTaskElement(taskText);
          column.appendChild(taskElement);
        });
      });
      
      updateTaskCounts();
      checkWipLimit();
    }
  });