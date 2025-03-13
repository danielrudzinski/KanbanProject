import { useState, useRef, useEffect } from 'react';
import { useKanban } from '../context/KanbanContext';
import TaskDetails from './TaskDetails';
import useDragAndDrop from '../hooks/useDragAndDrop';
import '../styles/components/Task.css';

function Task({ task, columnId }) {
  const { deleteTask } = useKanban();
  const [showDetails, setShowDetails] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const taskRef = useRef(null);

  const { handleDragStart, handleDragEnd } = useDragAndDrop();

  const fetchUserAvatar = async (userId) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(`/users/${userId}/avatar`, {
          headers: {
            'Accept': 'image/*, application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch avatar');
        }
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn(`Retry ${4 - retries} failed for user ${userId}:`, error);
        retries--;
        if (retries === 0) return null;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    return null;
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