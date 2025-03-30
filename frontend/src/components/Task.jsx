import { useState, useRef, useEffect, useCallback } from 'react';
import { useKanban } from '../context/KanbanContext';
import TaskDetails from './TaskDetails';
import EditableText from './EditableText';
import { getUserAvatar, assignUserToTask, fetchSubTasksByTaskId } from '../services/api';
import '../styles/components/Task.css';

function Task({ task, columnId }) {
  const { deleteTask, dragAndDrop, refreshTasks, updateTaskName } = useKanban();
  const [showDetails, setShowDetails] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [assignmentError, setAssignmentError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [hasUnfinishedSubtasks, setHasUnfinishedSubtasks] = useState(false);

  const taskRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Check if task has unfinished subtasks
  const checkUnfinishedSubtasks = useCallback(async () => {
    try {
      const subtasks = await fetchSubTasksByTaskId(task.id);
      const unfinishedExists = subtasks.some(subtask => !subtask.completed);
      setHasUnfinishedSubtasks(unfinishedExists);
    } catch (error) {
      console.error('Error checking subtasks:', error);
    }
  }, [task.id]);

  useEffect(() => {
    // If task has a user assigned, fetch their avatar
    if (task.userIds && task.userIds.length > 0) {
      // Get the first assigned user's avatar for display in the task card
      getUserAvatar(task.userIds[0]).then(url => {
        if (url) {
          setAvatarUrl(url);
        }
      });
    }
    
    // Check for unfinished subtasks when component mounts
    checkUnfinishedSubtasks();
  
    // Clean up object URL when component unmounts
    return () => {
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [task.userIds, task.id, checkUnfinishedSubtasks]);

  useEffect(() => {
    const handleSubtaskUpdate = () => {
      checkUnfinishedSubtasks();
    };

    // Listen for a custom event that will be dispatched from TaskDetails
    window.addEventListener('subtask-updated', handleSubtaskUpdate);

    return () => {
      window.removeEventListener('subtask-updated', handleSubtaskUpdate);
    };
  }, [checkUnfinishedSubtasks]);

  // Clear assignment error after 5 seconds
  useEffect(() => {
    if (assignmentError) {
      const timer = setTimeout(() => {
        setAssignmentError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [assignmentError]);

  const handleTaskClick = (e) => {
    if (e.target.className === 'delete-btn' || 
        e.target.className === 'confirm-delete-btn' || 
        e.target.className === 'cancel-delete-btn' ||
        e.target.classList.contains('editable-text') ||
        e.target.classList.contains('editable-text-input') ||
        e.target.classList.contains('warning-close-btn')) return;
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

    // Show warning only if task has unfinished subtasks and is being dragged
    if (hasUnfinishedSubtasks) {
      setShowWarning(true);
      
      // Auto-hide warning after 5 seconds
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 5000);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're dragging a task or a user
    if (e.dataTransfer.types.includes('application/task') || 
        e.dataTransfer.types.includes('application/user')) {
      setIsDragOver(true);
    }
  };
  
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Hide warning when task is dropped
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
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
    
    // Check if we're dropping a user
    if (e.dataTransfer.types.includes('application/user')) {
      try {
        const dataString = e.dataTransfer.getData('application/user');
        const userData = JSON.parse(dataString);
        
        if (userData.type === 'user') {
          const userId = userData.userId;
          
          console.log(`Attempting to assign user ${userId} to task ${task.id}`);
          
          try {
            // Call API to assign user - now with WIP check
            await assignUserToTask(task.id, parseInt(userId));
            
            // Update local state - assuming we want to append to existing users
            const updatedUserIds = task.userIds ? [...task.userIds] : [];
            if (!updatedUserIds.includes(userId)) {
              updatedUserIds.push(userId);
            }
            
            // Refresh tasks to get updated data
            refreshTasks();
            setAssignmentError(null);
          } catch (error) {
            // Display error message related to WIP limit
            setAssignmentError(error.message || 'Error assigning user to task');
            console.error('Error assigning user:', error.message);
          }
        }
      } catch (err) {
        console.error('Error processing user drop:', err);
        setAssignmentError('Error processing user assignment');
      }
    }
  };
  
  const onDragEndHandler = () => {
    console.log('Task drag end');
    
    // Hide warning when drag ends
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Remove the dragging class
    if (taskRef.current) {
      taskRef.current.classList.remove('dragging');
    }
  };

  const handleCloseWarning = (e) => {
    e.stopPropagation();
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
  };

  const renderTaskLabels = () => {
    if (!task.labels || task.labels.length === 0) return null;
    
    // We'll only show up to 3 labels in the compact view
    const visibleLabels = task.labels.slice(0, 3);
    const remainingCount = task.labels.length - 3;
    
    return (
      <div className="task-labels-preview">
        {visibleLabels.map((label) => {
          const labelColor = getLabelColor(label);
          return (
            <div 
              key={label} 
              className="task-label-pill" 
              title={label}
              data-tooltip={label}
            >
              <span 
                className="label-dot" 
                style={{ backgroundColor: labelColor }}
              ></span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="task-label-count" title={`${remainingCount} more label(s)`}>
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get label color (consistent with TaskLabels)
  const getLabelColor = (labelName) => {
    // Try to get from localStorage first
    const storedColors = localStorage.getItem('labelColors');
    if (storedColors) {
      const colorMap = JSON.parse(storedColors);
      if (colorMap[labelName]) return colorMap[labelName];
    }
  
    // Default colors based on predefined labels
    const colorMap = {
      'High Priority': '#FF4D4D',
      'Medium Priority': '#FFA500',
      'Low Priority': '#4CAF50',
      'Bug': '#FF0000',
      'Feature': '#2196F3',
      'Documentation': '#9C27B0'
    };
  
    return colorMap[labelName] || '#888888';
  };

  return (
    <>
      <div
        ref={taskRef}
        className={`task ${isDragOver ? 'user-drag-over' : ''}`}
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
          <EditableText 
            id={task.id} 
            text={task.title} 
            onUpdate={updateTaskName} 
            className="task-title"
            inputClassName="task-title-input"
            type="task"
          />
          {renderTaskLabels()}
          {renderUserAvatar()}
        </div>
        
        {/* Delete button */}
        <button 
          className="delete-btn" 
          title="Usuń zadanie"
          onClick={handleDeleteClick}
        >
          ×
        </button>
        
        {/* Error message for WIP limit */}
        {assignmentError && (
          <div className="assignment-error">
            {assignmentError}
          </div>
        )}

        {/* Inline warning for unfinished subtasks - only visible during drag operations */}
        {hasUnfinishedSubtasks && showWarning && (
          <div className="subtask-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-message">
              Nieukończone podzadania
            </div>
            <button 
              className="warning-close-btn" 
              onClick={handleCloseWarning}
            >
              ×
            </button>
          </div>
        )}
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
          onSubtaskUpdate={checkUnfinishedSubtasks} 
        />
      )}
    </>
  );
}

export default Task;