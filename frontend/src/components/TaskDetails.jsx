import React, { useState, useEffect, useRef } from 'react';
import { useKanban } from '../context/KanbanContext';
import { createPortal } from 'react-dom';
import { fetchUsers, assignUserToTask, fetchTask, removeUserFromTask, getUserAvatar, addSubTask, toggleSubTaskCompletion, deleteSubTask, updateSubTask, fetchSubTask, fetchSubTasksByTaskId, updateTask, assignParentTask, removeParentTask, getChildTasks, fetchTasks, getTaskColumnHistory, getTaskColumnTimeSpentSummary } from '../services/api';
import '../styles/components/TaskDetails.css';
import TaskLabels from './TaskLabels';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

function TaskDetails({ task, onClose, onSubtaskUpdate }) {
  const { refreshTasks } = useKanban();
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [avatarPreviews, setAvatarPreviews] = useState({});
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);
  const [showUserDeleteConfirmation, setShowUserDeleteConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [taskLabels, setTaskLabels] = useState([]);
  const [originalTaskDescription, setOriginalTaskDescription] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [editingTaskDescription, setEditingTaskDescription] = useState(false);
  const [editingTaskTitle, setEditingTaskTitle] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [originalTaskTitle, setOriginalTaskTitle] = useState('');
  const [parentTask, setParentTask] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showParentSelector, setShowParentSelector] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [childTasks, setChildTasks] = useState([]);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');
  const [originalDeadline, setOriginalDeadline] = useState('');
  const [columnHistory, setColumnHistory] = useState([]);
  const [columnHistoryPage, setColumnHistoryPage] = useState(0);
  const [columnTimeSpent, setColumnTimeSpent] = useState([]);
  const [isLoadingTimeSpent, setIsLoadingTimeSpent] = useState(false);
  const HISTORY_PAGE_SIZE = 4;
  const isDeadlineExpired = task.deadline && new Date(task.deadline) < new Date();
  const isDeadlineUpcoming = task.deadline && !isDeadlineExpired && 
    (new Date(task.deadline) - new Date()) < 24 * 60 * 60 * 1000;
  const { t } = useTranslation();

  const panelRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const taskDescriptionInputRef = useRef(null);
  const taskTitleInputRef = useRef(null);

  useEffect(() => {
    const handleEscapeKeyForPanel = (event) => {
      if (event.key === 'Escape' && 
          !showAssignForm && 
          !showDeleteConfirmation && 
          !showUserDeleteConfirmation) {
        onClose();
      }
    };
  
    document.addEventListener('keydown', handleEscapeKeyForPanel);
  
    return () => {
      document.removeEventListener('keydown', handleEscapeKeyForPanel);
    };
  }, [onClose, showAssignForm, showDeleteConfirmation, showUserDeleteConfirmation]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowAssignForm(false);
        setShowDeleteConfirmation(false);
        setShowUserDeleteConfirmation(false);
      }
    };

    if (showAssignForm || showDeleteConfirmation || showUserDeleteConfirmation) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAssignForm, showDeleteConfirmation, showUserDeleteConfirmation]);

  useEffect(() => {
    loadTaskData();
    
    return () => {
      Object.values(avatarPreviews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [task.id]);

  useEffect(() => {
    if (!loading) {
      positionPanel();
    }
  }, [loading]);
  
  const loadTaskData = async () => {
    try {
      setLoading(true);
      const taskData = await fetchTask(task.id);
      let assignedData = [];
      
      if (taskData.userIds && taskData.userIds.length > 0) {
        const usersData = await fetchUsers();
        assignedData = usersData.filter(user => 
          taskData.userIds.includes(user.id)
        );
      }
      
      if (taskData.parentTaskId) {
        try {
          const parentTaskData = await fetchTask(taskData.parentTaskId);
          setParentTask(parentTaskData);
        } catch (error) {
          console.error('Error fetching parent task:', error);
          setParentTask(null);
        }
      } else {
        setParentTask(null);
      }
  
      try {
        const childTasksData = await getChildTasks(task.id);
        setChildTasks(childTasksData || []);
      } catch (error) {
        console.error('Error fetching child tasks:', error);
        setChildTasks([]);
      }

      try {
        const historyData = await getTaskColumnHistory(task.id);
        setColumnHistory(historyData || []);
      } catch (error) {
        console.error('Error fetching column history:', error);
        setColumnHistory([]);
      }

      try {
        const historyData = await getTaskColumnHistory(task.id);
        setColumnHistory(historyData || []);
        loadColumnTimeSpent();
      } catch (error) {
        console.error('Error fetching column history:', error);
        setColumnHistory([]);
      }
      
      setAssignedUsers(assignedData);
      const usersData = await fetchUsers();
      setUsers(usersData || []);
      const subtasksData = await fetchSubTasksByTaskId(task.id);
      setSubtasks(subtasksData || []);
      const description = taskData.description || '';
      setTaskDescription(description);
      setOriginalTaskDescription(description);
      setTaskTitle(taskData.title);
      setOriginalTaskTitle(taskData.title);
      setTaskLabels(taskData.labels || []);
      
      // load avatars
      if (assignedData.length > 0) {
        const avatarPromises = assignedData.map(async user => {
          try {
            const avatarUrl = await getUserAvatar(user.id);
            return { userId: user.id, url: avatarUrl };
          } catch (error) {
            console.error('Error fetching user avatar:', error);
            return { userId: user.id, url: null };
          }
        });
        
        const avatarResults = await Promise.all(avatarPromises);
        const avatarMap = {};
        avatarResults.forEach(result => {
          if (result.url) {
            avatarMap[result.userId] = result.url;
          }
        });
        
        setAvatarPreviews(avatarMap);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading task data:', error);
      setLoading(false);
    }
  };

  const startEditingTaskTitle = () => {
    setOriginalTaskTitle(taskTitle);
    setEditingTaskTitle(true);
    setTimeout(() => {
      if (taskTitleInputRef.current) {
        taskTitleInputRef.current.focus();
      }
    }, 0);
  };
  
  const saveTaskTitle = async () => {
    try {
      await updateTask(task.id, { title: taskTitle });
      
      setOriginalTaskTitle(taskTitle);
      setEditingTaskTitle(false);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      refreshTasks();
    } catch (error) {
      console.error('Error saving task title:', error);
      toast.error(t('notifications.errorOccurred', { message: error.message }));
    }
  };
  
  const cancelEditingTaskTitle = () => {
    setTaskTitle(originalTaskTitle);
    setEditingTaskTitle(false);
  };

  const saveTaskDescription = async () => {
    try {
      await updateTask(task.id, { description: taskDescription });

      setOriginalTaskDescription(taskDescription);
      setEditingTaskDescription(false);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving task description:', error);
      toast.error(t('notifications.errorOccurred', { message: error.message }));
    }
  };
  
  const startEditingTaskDescription = () => {
    setOriginalTaskDescription(taskDescription); 
    setEditingTaskDescription(true);
    setTimeout(() => {
      if (taskDescriptionInputRef.current) {
        taskDescriptionInputRef.current.focus();
      }
    }, 0);
  };

  const startEditingSubTaskDescription = () => {
    if (!expandedSubtaskId) return;
    const currentSubtask = subtasks.find(s => s.id === expandedSubtaskId);
    if (currentSubtask) {
      setSubtaskDescription(currentSubtask.description || '');
    }
    setEditingDescription(true);
    setTimeout(() => {
      if (descriptionInputRef.current) {
        descriptionInputRef.current.focus();
      }
    }, 0);
  };

  const handleLabelsChange = (updatedLabels) => {
    const labelsArray = Array.isArray(updatedLabels) ? updatedLabels : [];
      
    const uniqueLabels = [...new Set(labelsArray)];
      
    if (uniqueLabels.length === labelsArray.length) {
      setTaskLabels(uniqueLabels);
      updateTask(task.id, { labels: uniqueLabels }).catch(error => {
        console.error('Error updating task labels:', error);
        toast.error('Wystąpił błąd podczas aktualizacji etykiet');
      });
    }
  };
  
  const cancelEditingTaskDescription = () => {
    setTaskDescription(originalTaskDescription);
    setEditingTaskDescription(false);
  };

  const handleaddSubTask = async () => {
    if (!newSubtaskTitle.trim()) return;
    
    try {
      await addSubTask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      await loadTaskData();
      if (onSubtaskUpdate) {
        onSubtaskUpdate();
      }
      
      window.dispatchEvent(new CustomEvent('subtask-updated', { detail: { taskId: task.id } }));
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Wystąpił błąd podczas dodawania podzadania');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubTaskCompletion(subtaskId);
      
      setSubtasks(prev => prev.map(subtask => {
        if (subtask.id === subtaskId) {
          return {
            ...subtask,
            completed: !subtask.completed
          };
        }
        return subtask;
      }));
      
      if (onSubtaskUpdate) {
        onSubtaskUpdate();
      }
      
      window.dispatchEvent(new CustomEvent('subtask-updated', { detail: { taskId: task.id } }));
      
    } catch (error) {
      console.error('Error toggling subtask completion:', error);
      toast.error('Wystąpił błąd podczas zmiany statusu podzadania');
    }
  };

  const confirmdeleteSubTask = (subtaskId) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      setSubtaskToDelete(subtask);
      setShowDeleteConfirmation(true);
    }
  };

  const handledeleteSubTask = async () => {
    if (!subtaskToDelete) return;
    
    try {
      await deleteSubTask(subtaskToDelete.id);
      setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskToDelete.id));
      if (onSubtaskUpdate) {
        onSubtaskUpdate();
      }
      
      window.dispatchEvent(new CustomEvent('subtask-updated', { detail: { taskId: task.id } }));
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      setShowDeleteConfirmation(false);
      setSubtaskToDelete(null);
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Wystąpił błąd podczas usuwania podzadania');
      setShowDeleteConfirmation(false);
      setSubtaskToDelete(null);
    }
  };

  const canceldeleteSubTask = () => {
    setShowDeleteConfirmation(false);
    setSubtaskToDelete(null);
  };

  const toggleSubtaskExpansion = async (subtaskId) => {
    if (expandedSubtaskId === subtaskId) {
      setExpandedSubtaskId(null);
      setEditingDescription(false);
    } else {
      setExpandedSubtaskId(subtaskId);
      setEditingDescription(false);
      
      try {
        const subtaskData = await fetchSubTask(subtaskId);
        setSubtaskDescription(subtaskData.description || '');
      } catch (error) {
        console.error('Error fetching subtask description:', error);
        setSubtaskDescription('');
      }
    }
  };

  const saveSubtaskDescription = async () => {
    if (!expandedSubtaskId) return;
    
    try {
      await updateSubTask(expandedSubtaskId, { description: subtaskDescription });
      
      setSubtasks(prev => prev.map(subtask => {
        if (subtask.id === expandedSubtaskId) {
          return {
            ...subtask,
            description: subtaskDescription
          };
        }
        return subtask;
      }));
      
      setEditingDescription(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving subtask description:', error);
      toast.error('Wystąpił błąd podczas zapisywania opisu podzadania');
    }
  };

  const cancelEditingDescription = () => {
    setEditingDescription(false);
    
    const currentSubtask = subtasks.find(s => s.id === expandedSubtaskId);
    if (currentSubtask) {
      setSubtaskDescription(currentSubtask.description || '');
    }
  };

  const renderUserAvatar = (user) => {
    const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"%3E%3C/path%3E%3C/svg%3E';
    
    return (
      <div className="user-avatar">
        <img 
          src={avatarPreviews[user.id] || defaultAvatar} 
          alt={`${user.name}'s avatar`}
          className="avatar-preview"
          onError={(e) => {
            e.target.src = defaultAvatar;
          }}
        />
      </div>
    );
  };

  const confirmRemoveUser = (userId) => {
    const user = assignedUsers.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setShowUserDeleteConfirmation(true);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete) return;
    
    try {
      await removeUserFromTask(task.id, userToDelete.id);
      
      if (avatarPreviews[userToDelete.id]) {
        URL.revokeObjectURL(avatarPreviews[userToDelete.id]);
        setAvatarPreviews(prev => {
          const newPreviews = {...prev};
          delete newPreviews[userToDelete.id];
          return newPreviews;
        });
      }
      
      await loadTaskData();
      refreshTasks();

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      setShowUserDeleteConfirmation(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Wystąpił błąd podczas usuwania użytkownika');
      setShowUserDeleteConfirmation(false);
      setUserToDelete(null);
    }
  };

  const cancelRemoveUser = () => {
    setShowUserDeleteConfirmation(false);
    setUserToDelete(null);
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) return;
    
    try {
      await assignUserToTask(task.id, parseInt(selectedUserId));
      const avatarUrl = await getUserAvatar(parseInt(selectedUserId));
      if (avatarUrl) {
        setAvatarPreviews(prev => ({
          ...prev,
          [selectedUserId]: avatarUrl
        }));
      }
      
      await loadTaskData();
      refreshTasks(); 

      setSuccess(true);
      setSelectedUserId('');
      setShowAssignForm(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Wystąpił błąd podczas przypisywania użytkownika');
    }
  };

  const handleShowParentSelector = async () => {
    try {
      const allTasks = await fetchTasks();
      const invalidIds = new Set([task.id, ...childTasks.map(child => child.id)]);
      const validTasks = allTasks.filter(t => !invalidIds.has(t.id));
      
      setAvailableTasks(validTasks);
      setShowParentSelector(true);
    } catch (error) {
      console.error('Error fetching available parent tasks:', error);
      toast.warning('Nie można pobrać dostępnych zadań nadrzędnych');
    }
  };

  const handleAssignParent = async () => {
    if (!selectedParentId) return;
    
    try {
      await assignParentTask(task.id, parseInt(selectedParentId));
      
      await loadTaskData();
      refreshTasks();
      
      setSuccess(true);
      setSelectedParentId('');
      setShowParentSelector(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error assigning parent task:', error);
      toast.error('Wystąpił błąd podczas przypisywania zadania nadrzędnego');
    }
  };

  const handleRemoveParent = async () => {
    try {
      await removeParentTask(task.id);
      await loadTaskData();
      refreshTasks();
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error removing parent task:', error);
      toast.error('Wystąpił błąd podczas usuwania zadania nadrzędnego');
    }
  };

  const startEditingDeadline = () => {
    const formattedDeadline = task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '';
    setOriginalDeadline(formattedDeadline);
    setDeadlineValue(formattedDeadline);
    setEditingDeadline(true);
  };
  
  const saveDeadline = async () => {
    try {
      await updateTask(task.id, { deadline: deadlineValue });
      
      setOriginalDeadline(deadlineValue);
      setEditingDeadline(false);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      refreshTasks();
    } catch (error) {
      console.error('Error saving task deadline:', error);
      toast.error(t('notifications.errorOccurred', { message: error.message }));
    }
  };
  
  const cancelEditingDeadline = () => {
    setDeadlineValue(originalDeadline);
    setEditingDeadline(false);
  };

  const loadColumnTimeSpent = async () => {
    try {
      setIsLoadingTimeSpent(true);
      const timeSpentData = await getTaskColumnTimeSpentSummary(task.id);
      setColumnTimeSpent(timeSpentData);
    } catch (error) {
      console.error('Error loading column time spent:', error);
    } finally {
      setIsLoadingTimeSpent(false);
    }
  };

  if (loading) {
    return createPortal(
      <div className="task-details-overlay">
        <div className="task-details-panel loading">
          <p>{t('board.loading')}</p>
        </div>
      </div>,
      document.body
    );
  }
  
  const positionPanel = () => {
    if (!panelRef.current) return;
    
    const panel = panelRef.current;
    const rect = panel.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      panel.style.left = `${window.innerWidth - rect.width - 20}px`;
    }
    
    if (rect.bottom > window.innerHeight) {
      panel.style.top = `${window.innerHeight - rect.height - 20}px`;
    }
  };
  
  return createPortal(
    <>
      <div
        className="task-details-overlay"
        onClick={(event) => {
          event.stopPropagation();
          setShowDeleteConfirmation(false);
          setSubtaskToDelete(null);
          onClose();
        }}
      />
      <div className="task-details-panel" ref={panelRef}>
      {/* Header */}
      <div className="panel-header">
        {editingTaskTitle ? (
          <div className="title-edit-form">
            <input
              ref={taskTitleInputRef}
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="title-input"
              placeholder={t('taskActions.editTitle')}
            />
          <div className="title-edit-actions">
            <button
              onClick={saveTaskTitle}
              className="save-title-btn"
              disabled={!taskTitle.trim()}
            >
              {t('taskActions.yes')}
            </button>
            <button
              onClick={cancelEditingTaskTitle}
              className="cancel-title-btn"
            >
              {t('taskActions.no')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3>{taskTitle || task.title}</h3>
          <div className="panel-actions">
            <button
              className="edit-title-btn"
              onClick={startEditingTaskTitle}
              title={t('taskActions.editTitle')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button 
              className="assign-user-icon" 
              onClick={() => setShowAssignForm(!showAssignForm)}
              title={t('taskActions.assignUser')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
            <button
              className="close-panel-btn"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
            >
              ×
            </button>
          </div>
        </>
      )}
      </div>
          
      <div className="task-details-main">
      {/* Column History Section */}
      <div className="column-history-section">
        <div className="section-header">
          <h4>{t('taskActions.columnHistory') || 'Column History'}</h4>
        </div>
        <div className="column-history-content">
          {columnHistory && columnHistory.length > 0 ? (
            <>
              <ul className="column-history-list">
                {columnHistory
                  .slice(columnHistoryPage * HISTORY_PAGE_SIZE, (columnHistoryPage + 1) * HISTORY_PAGE_SIZE)
                  .map((historyItem, index) => (
                    <li key={historyItem.id} className="column-history-item">
                      <div className="column-name">
                        <span className={index === 0 && columnHistoryPage === 0 ? "column-history-start" : 
                                        index === Math.min(HISTORY_PAGE_SIZE - 1, columnHistory.length - 1 - columnHistoryPage * HISTORY_PAGE_SIZE) ? 
                                        "column-history-current" : ""}>
                          {historyItem.columnName}
                        </span>
                        <span className="column-time">
                          {new Date(historyItem.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {index < Math.min(HISTORY_PAGE_SIZE - 1, columnHistory.length - 1 - columnHistoryPage * HISTORY_PAGE_SIZE) && (
                        <span className="column-history-arrow">←</span>
                      )}
                    </li>
                  ))}
              </ul>
              <div className="history-pagination">
                <button 
                  className="history-nav-btn"
                  disabled={columnHistoryPage === 0}
                  onClick={() => setColumnHistoryPage(prev => Math.max(0, prev - 1))}
                >
                  &larr; Previous
                </button>
                <span className="history-page-info">
                  {columnHistoryPage + 1} / {Math.ceil(columnHistory.length / HISTORY_PAGE_SIZE)}
                </span>
                <button 
                  className="history-nav-btn"
                  disabled={(columnHistoryPage + 1) * HISTORY_PAGE_SIZE >= columnHistory.length}
                  onClick={() => setColumnHistoryPage(prev => 
                    prev + 1 < Math.ceil(columnHistory.length / HISTORY_PAGE_SIZE) ? prev + 1 : prev
                  )}
                >
                  Next &rarr;
                </button>
              </div>
              <div className="column-time-stats">
                <h5>Time Spent in Columns</h5>
                {isLoadingTimeSpent ? (
                  <p>Loading time statistics...</p>
                ) : columnTimeSpent.length > 0 ? (
                  <ul className="time-spent-list">
                    {columnTimeSpent.map(column => (
                      <li key={column.columnId} className="time-spent-item">
                        <span className="column-name">{column.columnName}:</span>
                        <span className="time-value">{column.formattedTime}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No time statistics available</p>
                )}
              </div>
            </>
          ) : (
            <p>No column history available</p>
          )}
        </div>
      </div>
        
      {/* Deadline Section */}
      <div className="task-deadline-section">
        <div className="deadline-header">
            <span className="deadline-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          <h4>{t('taskActions.deadline')}:</h4>
        {!editingDeadline && (
          <button 
          onClick={startEditingDeadline}
          className="edit-description-btn"
          title={t('taskActions.editDeadline')}
        >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
          </button>
        )}
        </div>
  
      {editingDeadline ? (
        <div className="deadline-edit-form">
          <input 
            type="datetime-local"
            value={deadlineValue}
            onChange={(e) => setDeadlineValue(e.target.value)}
            className="deadline-input"
          />
          <div className="description-edit-actions">
            <button 
              onClick={saveDeadline}
              className="save-description-btn"
            >
              {t('taskActions.save')}
            </button>
            <button 
              onClick={cancelEditingDeadline}
              className="cancel-edit-btn"
            >
              {t('taskActions.cancel')}
            </button>
          </div>
        </div>
    ) : (
      <div className={`deadline-content ${isDeadlineExpired ? 'expired' : isDeadlineUpcoming ? 'upcoming' : ''}`}>
        {task.deadline ? (
          <>
            {new Date(task.deadline).toLocaleString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {isDeadlineExpired && (
              <span className="expired-tag">{t('taskActions.expired')}</span>
            )}
            {isDeadlineUpcoming && (
              <span className="upcoming-tag">{t('taskActions.upcoming')}</span>
            )}
          </>
        ) : (
          <p className="empty-deadline">{t('taskActions.noDeadline')}</p>
        )}
      </div>
    )}
      </div>
        
          {/* Task Description Section */}
          <div className="task-description-section">
          <div className="description-header">
            <h4>{t('taskActions.description')}:</h4>
            {!editingTaskDescription && (
              <button 
                onClick={startEditingTaskDescription}
                className="edit-description-btn"
                title={t('taskActions.editTaskDescription')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
          </div>
          
          {editingTaskDescription ? (
            <div className="description-edit-form">
              <textarea 
                ref={taskDescriptionInputRef}
                value={taskDescription} 
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder={t('taskActions.description')}
                className="description-textarea"
                rows={4}
              ></textarea>
              <div className="description-edit-actions">
                <button 
                  onClick={saveTaskDescription}
                  className="save-description-btn"
                >
                  {t('taskActions.save')}
                </button>
                <button 
                  onClick={cancelEditingTaskDescription}
                  className="cancel-edit-btn"
                >
                  {t('taskActions.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="description-display">
              {taskDescription ? (
                <p className="description-content">{taskDescription}</p>
              ) : (
                <p className="empty-description">{t('taskActions.noDescription')}</p>
              )}
            </div>
          )}
        </div>
        {/* User assignment dropdown */}
        {showAssignForm && (
          <div className="assign-user-dropdown">
            <div className="dropdown-header">
              <h4>{t('taskActions.assign')}</h4>
              <button 
                className="close-dropdown" 
                onClick={() => setShowAssignForm(false)}
              >
                ×
              </button>
            </div>
            <select 
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">{t('forms.wipLimit.selectUser')}</option>
              {users
                .filter(user => !assignedUsers.some(assignedUser => assignedUser.id === user.id))
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))
              }
            </select>
            <button 
              onClick={handleAssignUser} 
              disabled={!selectedUserId}
              className="assign-btn"
            >
              {t('taskActions.assign')}
            </button>
          </div>
        )}
  
        {/* Subtasks Section */}
        <div className="subtasks-section">
          <h4>{t('taskActions.subtasks')}</h4>
          
          <div className="add-subtask-form">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder={t('taskActions.shadowDescription')}
              className="subtask-input"
            />
            <button 
              onClick={handleaddSubTask}
              disabled={!newSubtaskTitle.trim()}
              className="add-subtask-btn"
            >
              {t('header.addTask')}
            </button>
          </div>
          
          {subtasks.length > 0 ? (
            <div className="subtasks-list">
              {subtasks.map(subtask => (
                <div key={subtask.id} className={`subtask-item ${expandedSubtaskId === subtask.id ? 'expanded' : ''}`}>
                  <div className="subtask-header">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      id={`subtask-${subtask.id}`}
                      className="subtask-checkbox"
                    />
                    <label 
                      htmlFor={`subtask-${subtask.id}`}
                      className={subtask.completed ? 'completed' : ''}
                    >
                      {subtask.title}
                    </label>
                    
                    <div className="subtask-actions">
                      <button
                        className="description-toggle-btn dark-bg-with-text"
                        onClick={() => toggleSubtaskExpansion(subtask.id)}
                        title={expandedSubtaskId === subtask.id ? t('taskActions.hideDetails') : t('taskActions.showDetails')}
                      >
                        <span className={expandedSubtaskId === subtask.id ? "arrow-icon rotated" : "arrow-icon"}>
                          ▼
                        </span>
                        <span className="button-text">{expandedSubtaskId === subtask.id ? t('taskActions.hideDetails') : t('taskActions.showDetails')}</span>
                      </button>
                      <button
                        className="delete-subtask-btn"
                        onClick={() => confirmdeleteSubTask(subtask.id)}
                        title={t('taskActions.deleteSubTask')}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {expandedSubtaskId === subtask.id && (
                    <div className="subtask-description-container">
                      {editingDescription ? (
                        <div className="description-edit-form">
                          <textarea 
                            ref={descriptionInputRef}
                            value={subtaskDescription} 
                            onChange={(e) => setSubtaskDescription(e.target.value)}
                            placeholder={t('taskActions.description')}
                            className="description-textarea"
                            rows={4}
                          ></textarea>
                          <div className="description-edit-actions">
                            <button 
                              onClick={saveSubtaskDescription}
                              className="save-description-btn"
                            >
                              {t('taskActions.save')}
                            </button>
                            <button 
                              onClick={cancelEditingDescription}
                              className="cancel-edit-btn"
                            >
                              {t('taskActions.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="description-display">
                          <div className="description-header">
                            <h5>{t('taskActions.description')}:</h5>
                            <button 
                              onClick={startEditingSubTaskDescription}
                              className="edit-description-btn"
                              title={t('taskActions.editSubTaskDescription')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                          {subtaskDescription ? (
                            <p className="description-content">{subtaskDescription}</p>
                          ) : (
                            <p className="empty-description">{t('taskActions.noDescription')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-subtasks">{t('taskActions.noSubtasks')}</p>
          )}
        </div>
  
        {/* Delete subtask confirmation dialog */}
        {showDeleteConfirmation && subtaskToDelete && (
          <div 
          className="delete-confirmation-overlay"
          onClick={canceldeleteSubTask}
          >
            <div className="delete-confirmation-dialog">
              <h4>{t('taskActions.confirmDeleteSubTask')}</h4>
              <p>{t('taskActions.confirmDeleteSubTask')} <strong>{subtaskToDelete.title}</strong>?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handledeleteSubTask}
                  className="confirm-btn"
                >
                  {t('taskActions.yes')}
                </button>
                <button 
                  onClick={canceldeleteSubTask}
                  className="cancel-btn"
                >
                  {t('taskActions.no')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete user confirmation dialog */}
        {showUserDeleteConfirmation && userToDelete && (
          <div
           className="delete-confirmation-overlay"
           onClick={canceldeleteSubTask}
           >
            <div className="delete-confirmation-dialog">
              <h4>{t('taskActions.confirmDeleteAssignedUser')}</h4>
              <p>{t('taskActions.confirmDeleteAssignedUser')} <strong>{userToDelete.name}</strong>?</p>
              <div className="confirmation-actions">
                <button 
                  onClick={handleRemoveUser}
                  className="confirm-btn"
                >
                  {t('taskActions.yes')}
                </button>
                <button 
                  onClick={cancelRemoveUser}
                  className="cancel-btn"
                >
                  {t('taskActions.no')}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
        <div className="task-labels-section">
        <h4>{t('board.labels')}</h4>
        <TaskLabels
          taskId={task.id}
          initialLabels={taskLabels}
          onLabelsChange={handleLabelsChange}
        />
        </div>

        {/* Parent Task section */}
        <div className="task-parent-section">
          <h4>Parent Task</h4>
    
        {parentTask ? (
          <div className="current-parent-task">
            <p>Current: <strong>{parentTask.title}</strong></p>
            <button 
              onClick={handleRemoveParent}
              className="remove-parent-btn"
              title={t('taskActions.delete')}
            >
              Remove link
            </button>
          </div>
       ) : (
          <p className="no-parent">No parent task</p>
        )}
    
        <button
          className="assign-parent-btn"
          onClick={handleShowParentSelector}
        >
          {parentTask ? 'Change parent task' : 'Assign parent task'}
        </button>
    
        {showParentSelector && (
          <div className="parent-selector">
            <select 
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
            >
              <option value="">{t('forms.wipLimit.selectUser')}</option>
              {availableTasks.map(availableTask => (
                <option key={availableTask.id} value={availableTask.id}>
                {availableTask.title}
                </option>
              ))}
            </select>
            <div className="parent-selector-actions">
              <button 
                onClick={handleAssignParent} 
                disabled={!selectedParentId}
                className="confirm-parent-btn"
              >
                {t('taskActions.yes')}
              </button>
              <button 
                onClick={() => setShowParentSelector(false)}
                className="cancel-parent-btn"
              >
                {t('taskActions.no')}
              </button>
            </div>
          </div>
        )}
    
        {childTasks.length > 0 && (
          <div className="child-tasks-section">
            <h5>Child Tasks:</h5>
            <ul className="child-tasks-list">
              {childTasks.map(childTask => (
                <li key={childTask.id} className="child-task-item">
                  {childTask.title}
                </li>
             ))}
            </ul>
          </div>
        )}
      </div>

        {/* Assigned users section */}
        {assignedUsers.length > 0 && (
          <div className="assigned-users-bar">
            <span>{t('taskActions.assigned')}:</span>
            <div className="avatar-list">
              {assignedUsers.map(user => (
                <div key={user.id} className="avatar-item" title={user.name}>
                  {renderUserAvatar(user)}
                  <button 
                    className="remove-user-btn"
                    onClick={() => confirmRemoveUser(user.id)}
                    title={t('forms.deleteUser')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
  
        {success && (
          <div className="success-message">
            {t('notifications.taskUpdated')}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}  

export default TaskDetails;