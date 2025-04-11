import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useKanban } from '../context/KanbanContext';
import TaskDetails from './TaskDetails';
import EditableText from './EditableText';
import { getUserAvatar, assignUserToTask, fetchSubTasksByTaskId, fetchTask } from '../services/api';
import { createPortal } from 'react-dom';
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
  const [showDescription, setShowDescription] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(false);

  const descriptionBtnRef = useRef(null);
  const taskRef = useRef(null);
  const warningTimeoutRef = useRef(null);

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
    if (task.userIds && task.userIds.length > 0) {
      getUserAvatar(task.userIds[0]).then(url => {
        if (url) {
          setAvatarUrl(url);
        }
      });
    }
    
    checkUnfinishedSubtasks();
  
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

    window.addEventListener('subtask-updated', handleSubtaskUpdate);

    return () => {
      window.removeEventListener('subtask-updated', handleSubtaskUpdate);
    };
  }, [checkUnfinishedSubtasks]);

  useEffect(() => {
    if (assignmentError) {
      const timer = setTimeout(() => {
        setAssignmentError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [assignmentError]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDescription && 
          !event.target.classList.contains('description-dropdown-btn') && 
          !event.target.closest('.description-popover')) {
        setShowDescription(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDescription]);

  useEffect(() => {
    if (showDescription && descriptionBtnRef.current) {
      let popover = document.querySelector(`.description-popover[data-task-id="${task.id}"]`);
      
      if (!popover && showDescription) {
        popover = document.createElement('div');
        popover.className = 'description-popover';
        popover.setAttribute('data-task-id', task.id);
        
        const arrow = document.createElement('div');
        arrow.className = 'description-popover-arrow';
        popover.appendChild(arrow);
        
        const content = document.createElement('div');
        content.className = 'description-popover-content';
        
        if (loadingDescription) {
          content.innerHTML = '<p class="loading-description">Ładowanie opisu...</p>';
        } else if (taskDescription) {
          content.innerHTML = `<p class="description-content">${taskDescription}</p>`;
        } else {
          content.innerHTML = '<p class="empty-description">Brak opisu.</p>';
        }
        
        popover.appendChild(content);
        document.body.appendChild(popover);
      }
      
      if (!popover) return;
      
      popover.style.opacity = '0';
      const btnRect = descriptionBtnRef.current.getBoundingClientRect();
      
      popover.style.left = `${btnRect.left + window.scrollX}px`;
      popover.style.top = `${btnRect.bottom + window.scrollY + 5}px`;
      popover.style.width = `${Math.max(200, btnRect.width * 1.5)}px`;
      
      const contentElement = popover.querySelector('.description-popover-content');
      if (contentElement) {
        if (loadingDescription) {
          contentElement.innerHTML = '<p class="loading-description">Ładowanie opisu...</p>';
        } else if (taskDescription) {
          contentElement.innerHTML = `<p class="description-content">${taskDescription}</p>`;
        } else {
          contentElement.innerHTML = '<p class="empty-description">Brak opisu.</p>';
        }
      }
      
      const arrow = popover.querySelector('.description-popover-arrow');
      if (arrow) {
        arrow.style.left = `${btnRect.width / 2}px`;
      }
      
      const popoverRect = popover.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (popoverRect.right > viewportWidth) {
        const newLeft = Math.max(10, viewportWidth - popoverRect.width - 10);
        popover.style.left = `${newLeft}px`;
        
        if (arrow) {
          const arrowLeft = btnRect.left - newLeft + btnRect.width / 2;
          arrow.style.left = `${Math.min(arrowLeft, popoverRect.width - 20)}px`;
        }
      }
      
      if (popoverRect.bottom > viewportHeight) {
        popover.style.top = `${btnRect.top + window.scrollY - popoverRect.height - 5}px`;
        
        if (arrow) {
          arrow.style.top = 'auto';
          arrow.style.bottom = '-8px';
          arrow.style.transform = 'rotate(180deg)';
        }
      }
      
      setTimeout(() => {
        popover.style.opacity = '1';
      }, 10);
    } else {
      const popover = document.querySelector(`.description-popover[data-task-id="${task.id}"]`);
      if (popover) {
        popover.style.opacity = '0';
        setTimeout(() => {
          if (popover.parentNode) {
            popover.parentNode.removeChild(popover);
          }
        }, 200);
      }
    }
  }, [showDescription, loadingDescription, taskDescription, task.id]);

  useEffect(() => {
    return () => {
      const popover = document.querySelector(`.description-popover[data-task-id="${task.id}"]`);
      if (popover && popover.parentNode) {
        popover.parentNode.removeChild(popover);
      }
    };
  }, [task.id]);

  useEffect(() => {
    const handleClosePopovers = (e) => {
      if (!e.detail || e.detail.exceptTaskId !== task.id) {
        setShowDescription(false);
      }
    };
    
    window.addEventListener('close-all-popovers', handleClosePopovers);
    
    return () => {
      window.removeEventListener('close-all-popovers', handleClosePopovers);
    };
  }, [task.id]);

  const handleTaskClick = (e) => {
    if (e.target.className === 'delete-btn' || 
        e.target.className === 'confirm-delete-btn' || 
        e.target.className === 'cancel-delete-btn' ||
        e.target.classList.contains('editable-text') ||
        e.target.classList.contains('editable-text-input') ||
        e.target.classList.contains('warning-close-btn') ||
        e.target.classList.contains('description-dropdown-btn') ||
        e.target.closest('.task-description-dropdown')) return;
    setShowDetails(!showDetails);
  };

  const handleDescriptionToggle = (e) => {
    e.stopPropagation();
    
    if (showDescription) {
      setShowDescription(false);
      return;
    }
    
    window.dispatchEvent(new CustomEvent('close-all-popovers', {
      detail: { exceptTaskId: task.id }
    }));

    if (!taskDescription) {
      setLoadingDescription(true);
      fetchTask(task.id)
        .then(taskData => setTaskDescription(taskData.description || ''))
        .catch(error => console.error('Error fetching task description:', error))
        .finally(() => setLoadingDescription(false));
    }
    
    setTimeout(() => {
      setShowDescription(true);
    }, 10);
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

  const onDragStartHandler = (e) => {
    console.log('Task drag start:', { taskId: task.id, columnId });
    
    const data = {
      id: task.id,
      type: 'task',
      sourceColumnId: columnId,
      sourceRowId: task.rowId
    };
    const dataString = JSON.stringify(data);
    e.dataTransfer.setData('application/task', dataString);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('columnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
    
    if (taskRef.current) {
      taskRef.current.classList.add('dragging');
    }

    if (hasUnfinishedSubtasks) {
      setShowWarning(true);
    
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
    
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    if (e.dataTransfer.types.includes('application/task')) {
      try {
        const dataString = e.dataTransfer.getData('application/task');
        const taskData = JSON.parse(dataString);
        const draggedTaskId = taskData.id;
        if (draggedTaskId === task.id) {
          return;
        }
        
        dragAndDrop.handleTaskReorder(draggedTaskId, task.id);
      } catch (err) {
        console.error('Error processing task drop for reordering:', err);
      }
    }
    
    if (e.dataTransfer.types.includes('application/user')) {
      try {
        const dataString = e.dataTransfer.getData('application/user');
        const userData = JSON.parse(dataString);
        
        if (userData.type === 'user') {
          const userId = userData.userId;
          
          console.log(`Attempting to assign user ${userId} to task ${task.id}`);
          
          try {
            await assignUserToTask(task.id, parseInt(userId));
            const updatedUserIds = task.userIds ? [...task.userIds] : [];
            if (!updatedUserIds.includes(userId)) {
              updatedUserIds.push(userId);
            }
            
            refreshTasks();
            setAssignmentError(null);
          } catch (error) {
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
    setShowWarning(false);
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
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

  const getLabelColor = (labelName) => {
    const storedColors = localStorage.getItem('labelColors');
    
    if (storedColors) {
      const colorMap = JSON.parse(storedColors);
      if (colorMap[labelName]) return colorMap[labelName];
    }

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
        <div className="task-header">
          <div className="task-content">
            <EditableText 
              id={task.id} 
              text={task.title} 
              onUpdate={updateTaskName} 
              className="task-title"
              inputClassName="task-title-input"
              type="task"
            />
            <div className="task-info-container">
              {renderTaskLabels()}
              {renderUserAvatar()}
            </div>
          </div>
          
          <button 
            className="delete-btn" 
            title="Usuń zadanie"
            onClick={handleDeleteClick}
          >
            ×
          </button>
        </div>
        
        {/* Footer with description dropdown button */}
        <div className="task-footer">
          <button 
            ref={descriptionBtnRef}
            className="description-dropdown-btn"
            title={showDescription ? 'Ukryj opis' : 'Pokaż opis'}
            onClick={handleDescriptionToggle}
          >
            {showDescription ? 'Ukryj opis ▲' : 'Pokaż opis ▼'}
          </button>
        </div>
        
        {/* Error and warning messages */}
        {assignmentError && (
          <div className="assignment-error">
            {assignmentError}
          </div>
        )}

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

      {/* Description popover */}
      {showDescription && createPortal(
        <div className="description-popover">
          <div className="description-popover-arrow"></div>
          <div className="description-popover-content">
            {loadingDescription ? (
              <p className="loading-description">Ładowanie opisu...</p>
            ) : taskDescription ? (
              <p className="description-content">{taskDescription}</p>
            ) : (
              <p className="empty-description">Brak opisu.</p>
            )}
          </div>
        </div>,
        document.body
    )}

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