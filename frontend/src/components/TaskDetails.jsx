import React, { useState, useEffect, useRef } from 'react';
import { useKanban } from '../context/KanbanContext';
import { createPortal } from 'react-dom';
import { fetchUsers, fetchColumns, assignUserToTask, fetchTask, removeUserFromTask, getUserAvatar, addSubTask, toggleSubTaskCompletion, deleteSubTask, updateSubTask, fetchSubTask, fetchSubTasksByTaskId, updateTask, assignParentTask, removeParentTask, getChildTasks, fetchTasks, getTaskColumnHistory, getTaskColumnTimeSpentSummary } from '../services/api';
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
  const [currentView, setCurrentView] = useState('main');
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
        
        if (historyData && historyData.length > 0) {
          const allColumns = await fetchColumns().catch(() => []);
          const columnNameMap = {};
          if (allColumns && allColumns.length) {
            allColumns.forEach(column => {
              columnNameMap[column.id] = column.name;
            });
          }
  
          const enhancedHistory = historyData.map(item => ({
            ...item,
            columnName: item.columnName || columnNameMap[item.columnId] || item.column_name || `Column ${item.columnId}`
          }));
  
          const uniqueHistory = enhancedHistory.filter((item, index, array) => {
            return array.findIndex(other => 
              Math.abs(new Date(other.changedAt) - new Date(item.changedAt)) < 1000 && 
              other.columnId === item.columnId
            ) === index;
          });
  
          console.log('Enhanced history:', uniqueHistory);
          setColumnHistory(uniqueHistory);
        } else {
          setColumnHistory([]);
        }
        
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

  const calculateDuration = (currentItem, nextItem) => {
    if (!nextItem) return '';
    
    const start = new Date(currentItem.changedAt);
    const end = new Date(nextItem.changedAt);
    const diffMs = Math.max(0, end - start);
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '< 1m';
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
                  className={`history-timeline-btn ${currentView === 'history' ? 'active' : ''}`}
                  onClick={() => setCurrentView(currentView === 'main' ? 'history' : 'main')}
                  title="History & Timeline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  className={`parent-child-btn ${currentView === 'relationships' ? 'active' : ''}`}
                  onClick={() => setCurrentView(currentView === 'relationships' ? 'main' : 'relationships')}
                  title="Parent & Child Tasks"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18M17 8l4 4m0 0l-4 4m4-4H3" />
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
        {currentView === 'main' ? (
          <>
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

          </>
        ) : currentView === 'relationships' ? (
          /* Parent & Child Tasks Management View */
          <div className="relationships-view">
            {/* User Assignment Section */}
            <div className="user-assignment-section">
              <div className="section-header">
                <span className="assignment-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <h4>{t('taskActions.assignUser')}</h4>
              </div>

              {assignedUsers.length > 0 && (
                <div className="current-assignments">
                  <h5>Currently Assigned:</h5>
                  <div className="assigned-users-grid">
                    {assignedUsers.map(user => (
                      <div key={user.id} className="assigned-user-card">
                        {renderUserAvatar(user)}
                        <span className="user-name">{user.name}</span>
                        <button 
                          className="remove-user-btn-card"
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

              <div className="add-assignment">
                <h5>Assign New User:</h5>
                <div className="assignment-controls">
                  <select 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="user-select"
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
                    className="assign-btn-relationships"
                  >
                    {t('taskActions.assign')}
                  </button>
                </div>
              </div>
            </div>

            {/* Parent Task Section */}
            <div className="parent-task-section">
              <div className="section-header">
                <span className="parent-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </span>
                <h4>Parent Task</h4>
              </div>
              
              {parentTask ? (
                <div className="current-parent-card">
                  <div className="parent-info">
                    <strong>{parentTask.title}</strong>
                    <span className="parent-id">ID: {parentTask.id}</span>
                  </div>
                  <button 
                    onClick={handleRemoveParent}
                    className="remove-parent-btn"
                    title="Remove parent link"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="no-parent-card">
                  <span>No parent task assigned</span>
                </div>
              )}

              <button
                className="manage-parent-btn"
                onClick={handleShowParentSelector}
              >
                {parentTask ? 'Change Parent Task' : 'Assign Parent Task'}
              </button>

              {showParentSelector && (
                <div className="parent-selector-card">
                  <h5>Select Parent Task:</h5>
                  <select 
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="parent-select"
                  >
                    <option value="">Choose a task...</option>
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
                      Assign
                    </button>
                    <button 
                      onClick={() => setShowParentSelector(false)}
                      className="cancel-parent-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Child Tasks Section */}
            <div className="child-tasks-section">
              <div className="section-header">
                <span className="child-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                </span>
                <h4>Child Tasks</h4>
              </div>

              {childTasks.length > 0 ? (
                <div className="child-tasks-grid">
                  {childTasks.map(childTask => (
                    <div key={childTask.id} className="child-task-card">
                      <div className="child-task-info">
                        <strong>{childTask.title}</strong>
                        <span className="child-id">ID: {childTask.id}</span>
                        {childTask.status && (
                          <span className={`status-badge ${childTask.status.toLowerCase()}`}>
                            {childTask.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-children-card">
                  <span>No child tasks</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* History & Timeline View */
          <div className="history-timeline-view">
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

            {/* Column History Section */}
            <div className="column-history-section">
              <div className="section-header">
                <h4>{t('taskActions.columnHistory') || 'Column History'}</h4>
              </div>
              <div className="column-history-content">
                {columnHistory && columnHistory.length > 0 ? (
                  <>
                    {/* Timeline Visualization */}
                    <div className="timeline-container">
                      <div className="timeline-line"></div>
                      {columnHistory
                        .slice(columnHistoryPage * HISTORY_PAGE_SIZE, (columnHistoryPage + 1) * HISTORY_PAGE_SIZE)
                        .map((historyItem, index) => {
                          const globalIndex = columnHistoryPage * HISTORY_PAGE_SIZE + index;
                          const isStart = globalIndex === 0; 
                          const isCurrent = globalIndex === columnHistory.length - 1;
                          
                          return (
                            <div key={historyItem.id} className={`timeline-item ${isStart ? 'timeline-start' : ''} ${isCurrent ? 'timeline-current' : ''}`}>
                              <div className="timeline-marker">
                                <div className="timeline-dot"></div>
                                {!isCurrent && <div className="timeline-connector"></div>}
                              </div>
                              <div className="timeline-content">
                              <div className="timeline-column-name">
                                {historyItem.columnName || 'Unknown Column'}
                                {isCurrent && <span className="current-badge">Start</span>}
                                {isStart && <span className="start-badge">Current</span>}
                              </div>
                                <div className="timeline-date">
                                  {new Date(historyItem.changedAt).toLocaleDateString()} at{' '}
                                  {new Date(historyItem.changedAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                                {!isCurrent && (
                                  <div className="timeline-duration">
                                    Duration: {calculateDuration(historyItem, columnHistory[globalIndex + 1])}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Progress Bar */}
                    <div className="history-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${((columnHistoryPage + 1) / Math.ceil(columnHistory.length / HISTORY_PAGE_SIZE)) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        Showing {columnHistoryPage * HISTORY_PAGE_SIZE + 1} - {Math.min((columnHistoryPage + 1) * HISTORY_PAGE_SIZE, columnHistory.length)} of {columnHistory.length} moves
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="history-navigation">
                      <button 
                        className="nav-btn nav-btn-prev"
                        disabled={columnHistoryPage === 0}
                        onClick={() => setColumnHistoryPage(prev => Math.max(0, prev - 1))}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                        Previous
                      </button>
                      
                      <div className="page-indicators">
                        {Array.from({ length: Math.ceil(columnHistory.length / HISTORY_PAGE_SIZE) }, (_, i) => (
                          <button
                            key={i}
                            className={`page-dot ${i === columnHistoryPage ? 'active' : ''}`}
                            onClick={() => setColumnHistoryPage(i)}
                            title={`Page ${i + 1}`}
                          />
                        ))}
                      </div>

                      <button 
                        className="nav-btn nav-btn-next"
                        disabled={(columnHistoryPage + 1) * HISTORY_PAGE_SIZE >= columnHistory.length}
                        onClick={() => setColumnHistoryPage(prev => 
                          prev + 1 < Math.ceil(columnHistory.length / HISTORY_PAGE_SIZE) ? prev + 1 : prev
                        )}
                      >
                        Next
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Time Statistics with Charts */}
                    <div className="column-time-stats">
                      <h5>Time Spent Analysis</h5>
                      {isLoadingTimeSpent ? (
                        <div className="loading-stats">
                          <div className="loading-spinner"></div>
                          <span>Loading time statistics...</span>
                        </div>
                      ) : columnTimeSpent.length > 0 ? (
                        <div className="time-stats-container">
                          {columnTimeSpent.map((column, index) => {
                            const maxTime = Math.max(...columnTimeSpent.map(c => c.totalTimeMs));
                            const percentage = (column.totalTimeMs / maxTime) * 100;
                            
                            return (
                              <div key={column.columnId} className="time-stat-item">
                                <div className="stat-header">
                                  <span className="stat-column-name">{column.columnName}</span>
                                  <span className="stat-time">{column.formattedTime}</span>
                                </div>
                                <div className="stat-bar-container">
                                  <div 
                                    className="stat-bar" 
                                    style={{ 
                                      width: `${percentage}%`,
                                      animationDelay: `${index * 0.1}s`
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="no-stats">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                          </svg>
                          <p>No time statistics available</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="no-history">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                    </svg>
                    <p>No column history available</p>
                    <span>This task hasn't moved between columns yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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