// API endpoints
const API_ENDPOINTS = {
    COLUMNS: '/columns',
    TASKS: '/tasks',
    USERS: '/users'
  };
  
  // Fetch all columns
  export const fetchColumns = async (retries = 3) => {
    while (retries > 0) {
        try {
            const response = await fetch(API_ENDPOINTS.COLUMNS);
            if (!response.ok) {
                throw new Error(`Error fetching columns: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (retries === 1) throw error;
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
    }
};
  
  // Fetch all tasks
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
  
  // Fetch all users
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
  
  // Fetch a single task
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
  
  // Add a new task
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
  
  // Update task's column
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
        console.error("Error details:", errorData); // Log the error message from the backend
        throw new Error(`Error updating task column: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  };
  
  // Assign user to task
  export const assignUserToTask = async (taskId, userId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error assigning user: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error assigning user to task ${taskId}:`, error);
      throw error;
    }
  };
  
  // Delete a task
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
  
  // Add a new column
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
  
  // Update column WIP limit
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
  
  // Delete a column
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