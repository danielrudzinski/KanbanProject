// API endpoints
const API_ENDPOINTS = {
  COLUMNS: '/columns',
  TASKS: '/tasks',
  USERS: '/users',
  ROWS: '/rows',
  SUBTASKS: '/subtasks',
  FILES: '/files'
};

// ====== COLUMN OPERATIONS ======
export const fetchColumns = async (retries = 3) => {
  while (retries > 0) {
    try {
      const response = await fetch(API_ENDPOINTS.COLUMNS);
      if (!response.ok) {
        throw new Error(`Error fetching columns: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching columns:', error);
      if (retries === 1) throw error;
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
};

export const fetchColumnById = async (columnId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.COLUMNS}/${columnId}`);
    if (!response.ok) {
      throw new Error(`Error fetching column: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching column ${columnId}:`, error);
    throw error;
  }
};

export const addColumn = async (name, wipLimit) => {
  try {
    const response = await fetch(API_ENDPOINTS.COLUMNS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        wipLimit: parseInt(wipLimit) || 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error adding column: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding column:', error);
    throw error;
  }
};

export const updateColumnWipLimit = async (columnId, wipLimit) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.COLUMNS}/${columnId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wipLimit: parseInt(wipLimit)
      })
    });

    if (response.status >= 200 && response.status < 300) {
      try {
        return await response.json();
      } catch (parseError) {
        // If JSON parsing fails but status is OK, return a synthetic success response
        console.warn('JSON parse error but update likely succeeded:', parseError);
        return {
          id: columnId,
          wipLimit: parseInt(wipLimit)
        };
      }
    }

    // Handle error responses
    throw new Error(`Error updating WIP limit: ${response.status}`);
  } catch (error) {
    console.error(`Error updating WIP limit for column ${columnId}:`, error);
    throw error;
  }
};

export const updateColumnPosition = async (columnId, position) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.COLUMNS}/${columnId}/position/${position}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error updating column position: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating position for column ${columnId}:`, error);
    throw error;
  }
};

export const deleteColumn = async (columnId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.COLUMNS}/${columnId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Error deleting column: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting column ${columnId}:`, error);
    throw error;
  }
};

export const updateColumnName = async (id, name) => {
  try {
    const response = await fetch(`/columns/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update column: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating column name:', error);
    throw error;
  }
};

// ====== TASK OPERATIONS ======
export const fetchTasks = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.TASKS);
    if (!response.ok) {
      throw new Error(`Error fetching tasks: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const fetchTask = async (taskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`);
    if (!response.ok) {
      throw new Error(`Error fetching task: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

export const addTask = async (title, columnId) => {
  try {
    const response = await fetch(API_ENDPOINTS.TASKS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        column: {
          id: columnId
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error adding task: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating task: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskColumn = async (taskId, columnId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        column: {
          id: columnId
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error details:", errorData);
      throw new Error(`Error updating task column: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskPosition = async (taskId, position) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/position/${position}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error updating task position: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating position for task ${taskId}:`, error);
    throw error;
  }
};

export const assignUserToTask = async (taskId, userId) => {
  const userWipStatus = await getUserWipLimit(userId);
  console.log(`User WIP status:`, userWipStatus);
  
  if (userWipStatus.willExceedLimit) {
    throw new Error(`WIP limit exceeded: ${userWipStatus.userName} has reached their maximum of ${userWipStatus.wipLimit} tasks.`);
  }
  
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error && errorData.error.includes('WIP limit')) {
        throw new Error(`Limit WIP osiągnięty: Nie można przypisać więcej tasków temu userowi.`);
      }
      throw new Error(`${response.status}: Failed to assign user to task`);
    }
    
    return await response.json();
  } catch (error) {
    if (!error.message.includes('WIP limit')) {
      console.error(`Error assigning user to task ${taskId}:`, error);
      throw new Error(`Limit WIP osiągnięty: Nie można przypisać więcej tasków temu userowi.`);
    }
    throw error;
  }
};

export async function getUserWipLimit(userId) {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/wip-status`);
    
    if (!response.ok) {
      throw new Error('Failed to check user WIP status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking user WIP limit:', error);
    throw error;
  }
}

export async function updateUserWipLimit(userId, wipLimit) {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/wip-limit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wipLimit),
    });

    if (!response.ok) {
      throw new Error('Failed to update user WIP limit');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user WIP limit:', error);
    throw error;
  }
}

export const removeUserFromTask = async (taskId, userId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error removing user: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error removing user from task ${taskId}:`, error);
    throw error;
  }
};

export const addLabelToTask = async (taskId, label) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/label/${label}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error adding label: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding label to task ${taskId}:`, error);
    throw error;
  }
};

export const removeLabelFromTask = async (taskId, label) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/label/${label}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error removing label: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error removing label from task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskLabels = async (taskId, labels) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/labels`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(labels)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating task labels: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating labels for task ${taskId}:`, error);
    throw error;
  }
};

export const getAllLabels = async () => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/get/all/labels`);
    if (!response.ok) {
      throw new Error(`Error fetching labels: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all labels:', error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Error deleting task: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    throw error;
  }
};

export const updateTaskRow = async (taskId, rowId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        row: rowId === null ? null : {
          id: rowId
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error details:", errorData);
      throw new Error(`Error updating task row: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId} row:`, error);
    throw error;
  }
};

export const updateTaskName = async (id, name) => {
  try {
    const response = await fetch(`/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating task name:', error);
    throw error;
  }
};

// ====== ROW OPERATIONS ======
export const fetchRows = async (retries = 3) => {
  while (retries > 0) {
    try {
      const response = await fetch(API_ENDPOINTS.ROWS);
      if (!response.ok) {
        throw new Error(`Error fetching rows: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching rows:', error);
      if (retries === 1) throw error;
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
};

export const fetchRow = async (rowId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ROWS}/${rowId}`);
    if (!response.ok) {
      throw new Error(`Error fetching row: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching row ${rowId}:`, error);
    throw error;
  }
};

export const addRow = async (name, wipLimit) => {
  try {
    const response = await fetch(API_ENDPOINTS.ROWS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        wipLimit: parseInt(wipLimit) || 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error adding row: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
};

export const updateRowWipLimit = async (rowId, wipLimit) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ROWS}/${rowId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        wipLimit: parseInt(wipLimit)
      })
    });

    if (response.status >= 200 && response.status < 300) {
      try {
        return await response.json();
      } catch (parseError) {
        console.warn('JSON parse error but update likely succeeded:', parseError);
        return {
          id: rowId,
          wipLimit: parseInt(wipLimit)
        };
      }
    }

    throw new Error(`Error updating row WIP limit: ${response.status}`);
  } catch (error) {
    console.error(`Error updating WIP limit for row ${rowId}:`, error);
    throw error;
  }
};

export const updateRowPosition = async (rowId, position) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ROWS}/${rowId}/position/${position}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error updating row position: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating position for row ${rowId}:`, error);
    throw error;
  }
};

export const deleteRow = async (rowId, cascade = false) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.ROWS}/${rowId}${cascade ? '?cascade=true' : ''}`, {
      method: 'DELETE'
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Error deleting row: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting row ${rowId}:`, error);
    throw error;
  }
};

export const updateRowName = async (id, name) => {
  try {
    const response = await fetch(`/rows/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update row: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating row name:', error);
    throw error;
  }
};

// ====== USER OPERATIONS ======
export const fetchUsers = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.USERS);
    if (!response.ok) {
      throw new Error(`Error fetching users: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const fetchUser = async (userId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`);
    if (!response.ok) {
      throw new Error(`Error fetching user: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
};

export const addUser = async (userData) => {
  try {
    const response = await fetch(API_ENDPOINTS.USERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error adding user: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating user: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

export const patchUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`Error patching user: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error patching user ${userId}:`, error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Error deleting user: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

export const uploadUserAvatar = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/avatar`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error uploading avatar: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error uploading avatar for user ${userId}:`, error);
    throw error;
  }
};

export const getUserAvatar = async (userId) => {
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

export const deleteUserAvatar = async (userId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/avatar`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting avatar: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error deleting avatar for user ${userId}:`, error);
    throw error;
  }
};

// ====== SUBTASK OPERATIONS ======
export const fetchSubTasks = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.SUBTASKS);
    if (!response.ok) {
      throw new Error(`Error fetching subtasks: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    throw error;
  }
};

export const fetchSubTask = async (subTaskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}`);
    if (!response.ok) {
      throw new Error(`Error fetching subtask: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching subtask ${subTaskId}:`, error);
    throw error;
  }
};

export const fetchSubTasksByTaskId = async (taskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/task/${taskId}`);
    if (!response.ok) {
      throw new Error(`Error fetching subtasks for task: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching subtasks for task ${taskId}:`, error);
    throw error;
  }
};

export const addSubTask = async (taskId, title) => {
  try {
    const response = await fetch('/subtasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        completed: false,
        task: {
          id: taskId
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error adding subtask: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding subtask:', error);
    throw error;
  }
};

export const updateSubTask = async (subTaskId, subTaskData) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subTaskData)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating subtask: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating subtask ${subTaskId}:`, error);
    throw error;
  }
};

export const toggleSubTaskCompletion = async (subTaskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}/change`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error toggling subtask completion: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error toggling completion for subtask ${subTaskId}:`, error);
    throw error;
  }
};

export const updateSubTaskPosition = async (subTaskId, position) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}/position/${position}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error updating subtask position: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating position for subtask ${subTaskId}:`, error);
    throw error;
  }
};

export const assignTaskToSubTask = async (subTaskId, taskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error assigning task to subtask: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error assigning task ${taskId} to subtask ${subTaskId}:`, error);
    throw error;
  }
};

export const deleteSubTask = async (subTaskId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBTASKS}/${subTaskId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Error deleting subtask: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting subtask ${subTaskId}:`, error);
    throw error;
  }
};

// ====== FILE OPERATIONS ======
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_ENDPOINTS.FILES}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error uploading file: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const getFile = async (fileId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.FILES}/${fileId}`);
    if (!response.ok) {
      throw new Error(`Error fetching file: ${response.status}`);
    }
    return response; // Return the full response to handle as blob
  } catch (error) {
    console.error(`Error fetching file ${fileId}:`, error);
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`${API_ENDPOINTS.FILES}/${fileId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting file: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
};