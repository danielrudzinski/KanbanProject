import { createContext, useState, useEffect, useContext } from 'react';
import { fetchColumns, fetchTasks, updateTaskColumn, deleteTask, addTask, addColumn, updateColumnWipLimit, deleteColumn } from '../services/api';

const KanbanContext = createContext();

export function KanbanProvider({ children }) {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map of column ids to their frontend keys
  const [columnMap, setColumnMap] = useState({});
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch columns
        const columnsData = await fetchColumns();
        
        // Sort columns (Requested, In Progress, Done, others)
        const sortedColumns = columnsData.sort((a, b) => {
          const order = {
            'Requested': 0,
            'In Progress': 1,
            'Done': 2,
            'Expedite': 3
          };
          const orderA = order[a.name] !== undefined ? order[a.name] : 99;
          const orderB = order[b.name] !== undefined ? order[b.name] : 99;
          return orderA - orderB;
        });
        
        // Create column mapping
        const newColumnMap = {};
        sortedColumns.forEach(column => {
          const columnKey = column.name.toLowerCase().replace(/\s+/g, '-');
          newColumnMap[columnKey] = column.id;
        });
        
        setColumns(sortedColumns);
        setColumnMap(newColumnMap);
        
        // Fetch tasks
        const tasksData = await fetchTasks();
        setTasks(tasksData);
        
        // Fetch users (if needed)
        // const usersData = await fetchUsers();
        // setUsers(usersData);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Helper function to get requestedColumnId
  const getRequestedColumnId = () => {
    return columnMap['requested'];
  };
  
  // Add a new task
  const handleAddTask = async (title) => {
    try {
      // Find first column in the sorted list
      if (columns.length === 0) {
        throw new Error('Nie ma żadnej kolumny. Dodaj najpierw kolumnę.');
      }
      
      const firstColumn = columns[0];
      const newTask = await addTask(title, firstColumn.id);
      setTasks([...tasks, newTask]);

      await refreshTasks();
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const refreshTasks = async () => {
    try {
      const updatedTasks = await fetchTasks();
      setTasks(updatedTasks);
    } catch (err) {
      setError(err.message);
    }
  };  
  
  // Add a new column
  const handleAddColumn = async (name, wipLimit) => {
    try {
      const newColumn = await addColumn(name, wipLimit);
      
      // Update column map
      const columnKey = name.toLowerCase().replace(/\s+/g, '-');
      setColumnMap(prev => ({
        ...prev,
        [columnKey]: newColumn.id
      }));
      
      setColumns([...columns, newColumn]);
      return newColumn;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Update column WIP limit
  const handleUpdateWipLimit = async (columnId, newLimit) => {
    try {
      await updateColumnWipLimit(columnId, newLimit);
      // Refresh columns to get the latest state
      const updatedColumns = await fetchColumns();
      setColumns(updatedColumns);
    } catch (err) {
      console.error('Failed to update WIP limit:', err);
      setError('Failed to update WIP limit. Please try again.');
    }
  };
  
  // Delete column
  const handleDeleteColumn = async (columnId) => {
    try {
      await deleteColumn(columnId);
      
      // Update column map
      const updatedColumnMap = { ...columnMap };
      for (const [key, value] of Object.entries(updatedColumnMap)) {
        if (value === columnId) {
          delete updatedColumnMap[key];
          break;
        }
      }
      setColumnMap(updatedColumnMap);
      
      // Remove column from state
      setColumns(columns.filter(column => column.id !== columnId));
      
      // Move tasks to first column if needed
      if (columns.length > 1) {
        const firstColumn = columns.find(col => col.id !== columnId);
        if (firstColumn) {
          // Move tasks from deleted column to first column
          const tasksToMove = tasks.filter(task => task.columnId === columnId);
          
          const updatedTasks = tasks.map(task => 
            task.columnId === columnId 
              ? { ...task, columnId: firstColumn.id } 
              : task
          );
          
          setTasks(updatedTasks);
          
          // Update tasks in backend
          tasksToMove.forEach(async (task) => {
            await updateTaskColumn(task.id, firstColumn.id);
          });
        }
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Move task between columns
  const handleMoveTask = async (taskId, newColumnId) => {
    try {
      await updateTaskColumn(taskId, newColumnId);
      
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, columnId: newColumnId } 
          : task
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const value = {
    columns,
    tasks,
    users,
    loading,
    error,
    columnMap,
    addTask: handleAddTask,
    addColumn: handleAddColumn,
    updateWipLimit: handleUpdateWipLimit,
    deleteColumn: handleDeleteColumn,
    deleteTask: handleDeleteTask,
    moveTask: handleMoveTask,
    getRequestedColumnId,
    refreshTasks,
  };
  
  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};

export default KanbanContext;