import { useState, useRef } from 'react';
import { useKanban } from '../context/KanbanContext';
import TaskDetails from './TaskDetails';
import useDragAndDrop from '../hooks/useDragAndDrop';
import '../styles/components/Task.css';

function Task({ task, columnId }) {
  const { deleteTask } = useKanban();
  const [showDetails, setShowDetails] = useState(false);
  const taskRef = useRef(null);

  const { handleDragStart, handleDragEnd } = useDragAndDrop();

  const handleTaskClick = (e) => {
      if (e.target.className === 'delete-btn') return;
      setShowDetails(!showDetails);
  };

  const handleDeleteClick = (e) => {
      e.stopPropagation();
      const taskElement = taskRef.current;
      taskElement.style.opacity = '0';
      taskElement.style.transform = 'translateX(10px)';
      setTimeout(() => {
          deleteTask(task.id);
      }, 200);
  };

  return (
    <>
      <div
        ref={taskRef}
        className="task"
        draggable={true}
        onClick={handleTaskClick}
        onDragStart={(e) => handleDragStart(e, { taskId: task.id, sourceColumnId: columnId })}
        onDragEnd={handleDragEnd}
        data-task-id={task.id}
      >
        <div className="task-content">
          {task.title}
          {task.user}
        </div>
        <button 
          className="delete-btn" 
          title="Usuń zadanie"
          onClick={handleDeleteClick}
        >
          ×
        </button>
      </div>

      {showDetails && (
        <TaskDetails 
          task={task} 
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

export default Task;
