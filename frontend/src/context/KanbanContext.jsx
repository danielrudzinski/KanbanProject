import { createContext, useState, useEffect, useContext } from 'react';
import { 
  fetchColumns, 
  fetchTasks, 
  updateTaskColumn, 
  deleteTask, 
  addTask, 
  addColumn, 
  updateColumnWipLimit, 
  deleteColumn,
  fetchRows,
  addRow,
  updateRowWipLimit,
  deleteRow,
  updateTaskRow
} from '../services/api';
import useDragAndDrop from '../hooks/useDragAndDrop';

const KanbanContext = createContext();

export function KanbanProvider({ children }) {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rows, setRows] = useState([]);
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
        
        // Fetch rows
        try {
          const rowsData = await fetchRows();
          setRows(rowsData);
        } catch (rowErr) {
          console.error('Error fetching rows:', rowErr);
          // If rows can't be fetched, we'll just use the board without rows
          setRows([]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Add a new task
  const handleAddTask = async (title, rowId) => {
    try {
      // Find first column in the sorted list
      if (columns.length === 0) {
        throw new Error('Nie ma żadnej kolumny. Dodaj najpierw kolumnę.');
      }
      
      const firstColumn = columns[0];
      const newTask = await addTask(title, firstColumn.id);
      
      // If rowId is provided, update the task's row
      if (rowId) {
        await updateTaskRow(newTask.id, rowId);
        newTask.rowId = rowId;
      }
      
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
  
  // Add a new row
  const handleAddRow = async (name, wipLimit) => {
    try {
      const newRow = await addRow(name, wipLimit);
      setRows([...rows, newRow]);
      return newRow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  // Update column WIP limit
  const handleUpdateWipLimit = async (columnId, newLimit) => {
    try {
      await updateColumnWipLimit(columnId, newLimit);
      
      // Fetch fresh column data while preserving order
      const updatedColumns = await fetchColumns();
      const columnOrderMap = {};
      columns.forEach((col, index) => {
        columnOrderMap[col.id] = index;
      });
      
      // Sort updated columns based on original order
      const sortedUpdatedColumns = updatedColumns.sort((a, b) => {
        return columnOrderMap[a.id] - columnOrderMap[b.id];
      });
      
      setColumns(sortedUpdatedColumns);
    } catch (err) {
      console.error('Failed to update WIP limit:', err);
      setError('Failed to update WIP limit. Please try again.');
    }
  };
  
  // Update row WIP limit
  const handleUpdateRowWipLimit = async (rowId, newLimit) => {
    try {
      await updateRowWipLimit(rowId, newLimit);
      
      // Fetch fresh row data
      const updatedRows = await fetchRows();
      setRows(updatedRows);
    } catch (err) {
      console.error('Failed to update row WIP limit:', err);
      setError('Failed to update row WIP limit. Please try again.');
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
  
  // Delete row
  const handleDeleteRow = async (rowId) => {
    try {
      await deleteRow(rowId);
      
      // Remove row from state
      setRows(rows.filter(row => row.id !== rowId));
      
      // Reset rowId for tasks in this row
      const tasksToUpdate = tasks.filter(task => task.rowId === rowId);
      
      const updatedTasks = tasks.map(task => 
        task.rowId === rowId 
          ? { ...task, rowId: null } 
          : task
      );
      
      setTasks(updatedTasks);
      
      // Update tasks in backend
      tasksToUpdate.forEach(async (task) => {
        await updateTaskRow(task.id, null);
      });
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
  
  // Move task between columns and/or rows
  const handleMoveTask = async (taskId, newColumnId, newRowId) => {
    try {
      await updateTaskColumn(taskId, newColumnId);
      
      let updatedTask = { ...tasks.find(task => task.id === taskId), columnId: newColumnId };
      
      // If rowId is provided, update the task's row
      if (newRowId !== undefined) {
        await updateTaskRow(taskId, newRowId);
        updatedTask.rowId = newRowId;
      }
      
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Move column
  const handleMoveColumn = async (columnId, targetColumnId) => {
    try {
      // Find the index of both columns
      const columnIndex = columns.findIndex(col => col.id === columnId);
      const targetIndex = columns.findIndex(col => col.id === targetColumnId);
      
      if (columnIndex === -1 || targetIndex === -1) return;
      
      // Create a new column array with the moved column
      const newColumns = [...columns];
      const [movedColumn] = newColumns.splice(columnIndex, 1);
      newColumns.splice(targetIndex, 0, movedColumn);
      
      setColumns(newColumns);
      
      // We could potentially update backend here if needed
      // For now just update the state
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Move row
  const handleMoveRow = async (rowId, targetRowId) => {
    try {
      // Find the index of both rows
      const rowIndex = rows.findIndex(row => row.id === rowId);
      const targetIndex = rows.findIndex(row => row.id === targetRowId);
      
      if (rowIndex === -1 || targetIndex === -1) return;
      
      // Create a new row array with the moved row
      const newRows = [...rows];
      const [movedRow] = newRows.splice(rowIndex, 1);
      newRows.splice(targetIndex, 0, movedRow);
      
      setRows(newRows);
      
      // We could potentially update backend here if needed
      // For now just update the state
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Set up drag and drop functionality
  const dragAndDrop = useDragAndDrop(handleMoveTask);
  
  const value = {
    columns,
    tasks,
    rows,
    users,
    loading,
    error,
    columnMap,
    addTask: handleAddTask,
    addColumn: handleAddColumn,
    addRow: handleAddRow,
    updateWipLimit: handleUpdateWipLimit,
    updateRowWipLimit: handleUpdateRowWipLimit,
    deleteColumn: handleDeleteColumn,
    deleteRow: handleDeleteRow,
    deleteTask: handleDeleteTask,
    moveTask: handleMoveTask,
    moveColumn: handleMoveColumn,
    moveRow: handleMoveRow,
    refreshTasks,
    dragAndDrop // Export drag and drop handlers
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