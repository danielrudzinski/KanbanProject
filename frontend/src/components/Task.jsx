import { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import TaskDetails from './TaskDetails';
import '../styles/components/Task.css';

function Task({ task, columnId }) {
  const { deleteTask, dragAndDrop } = useKanban();
  const [showDetails, setShowDetails] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const taskRef = useRef(null);

  const { handleDragStart, handleDragEnd } = dragAndDrop;

  const fetchUserAvatar = async (userId) => {
    try {
        const response = await fetch(`/users/${userId}/avatar`, {
            headers: {
                'Accept': 'image/*, application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            console.warn(`Could not fetch avatar for user ${userId}: ${response.status}`);
            return null;
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.warn(`Error fetching avatar for user ${userId}:`, error);
        return null;
    }
  };

  useEffect(() => {
    // If task has a user assigned, fetch their avatar
    if (task.userIds && task.userIds.length > 0) {
      // Get the first assigned user's avatar for display in the task card
      fetchUserAvatar(task.userIds[0]).then(url => {
        if (url) {
          setAvatarUrl(url);
        }
      });
    }

    // Clean up object URL when component unmounts
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [task.userIds]);

  const handleTaskClick = (e) => {
    if (e.target.className === 'delete-btn' || 
        e.target.className === 'confirm-delete-btn' || 
        e.target.className === 'cancel-delete-btn') return;
    setShowDetails(!showDetails);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
    const taskElement = taskRef.current;
    taskElement.style.opacity = '0';
    taskElement.style.transform = 'translateX(10px)';
    setTimeout(() => {
      deleteTask(task.id);
    }, 200);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const renderUserAvatar = () => {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E';
    
    if (!task.userIds || task.userIds.length === 0) {
      return null;
    }
    
    return (
      <div className="task-avatar">
        <img 
          src={avatarUrl || defaultAvatar} 
          alt="User avatar"
          className="avatar-preview"
          onError={(e) => {
            e.target.src = defaultAvatar;
          }}
        />
        {task.userIds.length > 1 && (
          <span className="avatar-count">+{task.userIds.length - 1}</span>
        )}
      </div>
    );
  };

  // Handle drag start event
  const onDragStartHandler = (e) => {
    console.log('Task drag start:', { taskId: task.id, columnId });
    
    // Set the data directly in the format expected by handleDrop
    const data = {
      id: task.id,
      type: 'task',
      sourceColumnId: columnId,
      sourceRowId: task.rowId
    };
    
    // Set the data in standard format
    const dataString = JSON.stringify(data);
    e.dataTransfer.setData('application/task', dataString);
    
    // For backwards compatibility
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('columnId', columnId);
    
    e.dataTransfer.effectAllowed = 'move';
    
    // Add a class to indicate dragging
    if (taskRef.current) {
      taskRef.current.classList.add('dragging');
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're dragging a task
    if (e.dataTransfer.types.includes('application/task')) {
      // Add visual cue for dropping
      taskRef.current.classList.add('task-drag-over');
    }
  };
  
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual cue
    taskRef.current.classList.remove('task-drag-over');
  };
  
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove visual cue
    taskRef.current.classList.remove('task-drag-over');
    
    // Check if we're dropping a task
    if (e.dataTransfer.types.includes('application/task')) {
      try {
        const dataString = e.dataTransfer.getData('application/task');
        const taskData = JSON.parse(dataString);
        
        // Extract the dragged task ID
        const draggedTaskId = taskData.id;
        
        // Don't reorder if dropping on itself
        if (draggedTaskId === task.id) {
          return;
        }
        
        // Call the context method to handle task reordering
        dragAndDrop.handleTaskReorder(draggedTaskId, task.id);
      } catch (err) {
        console.error('Error processing task drop for reordering:', err);
      }
    }
  };
  
  const onDragEndHandler = (e) => {
    console.log('Task drag end');
    
    // Remove the dragging class
    if (taskRef.current) {
      taskRef.current.classList.remove('dragging');
    }
  };

  return (
    <>
      <div
        ref={taskRef}
        className="task"
        draggable="true"
        onClick={handleTaskClick}
        onDragStart={onDragStartHandler}
        onDragEnd={onDragEndHandler}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-task-id={task.id}
        data-column-id={columnId}
        data-row-id={task.rowId || "null"}
      >
        <div className="task-content">
          <div className="task-title">{task.title}</div>
          {renderUserAvatar()}
        </div>
        <button 
          className="delete-btn" 
          title="Usuń zadanie"
          onClick={handleDeleteClick}
        >
          ×
        </button>
      </div>

      {isConfirmingDelete && (
        <div className="delete-modal-overlay" onClick={handleCancelDelete}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <p>Czy na pewno chcesz usunąć to zadanie?</p>
            <div className="confirmation-buttons">
              <button className="confirm-delete-btn" onClick={handleConfirmDelete}>Tak</button>
              <button className="cancel-delete-btn" onClick={handleCancelDelete}>Nie</button>
            </div>
          </div>
        </div>
      )}

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