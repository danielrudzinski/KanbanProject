/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
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
  updateTaskRow,
  updateColumnPosition,
  updateRowPosition,
  updateTaskPosition,
  updateTaskName,
  updateRowName,
  updateColumnName,
  getUserWipLimit,
  updateUserWipLimit,
} from '../services/api';

const KanbanContext = createContext();

export function KanbanProvider({ children }) {
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [columnMap, setColumnMap] = useState({});
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const columnsData = await fetchColumns();
        const sortedColumns = columnsData.sort((a, b) => a.position - b.position);
        const newColumnMap = {};
        sortedColumns.forEach(column => {
          const columnKey = column.name.toLowerCase().replace(/\s+/g, '-');
          newColumnMap[columnKey] = column.id;
        });
        
        setColumns(sortedColumns);
        setColumnMap(newColumnMap);
        
        let rowsData = [];
        try {
          rowsData = await fetchRows();
          const sortedRows = rowsData.sort((a, b) => a.position - b.position);
          setRows(sortedRows);
        } catch (rowErr) {
          console.error('Error fetching rows:', rowErr);
          rowsData = [];
          setRows([]);
        }
        
        const tasksData = await fetchTasks();
        if (rowsData.length > 0) {
          const defaultRowId = rowsData[0].id;
          const updatedTasks = tasksData.map(task => 
            (!task.rowId || task.rowId === null) ? { ...task, rowId: defaultRowId } : task
          );
          setTasks(updatedTasks);
        } else {
          setTasks(tasksData);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const handleUpdateTaskName = async (taskId, newName) => {
    try {
      await updateTaskName(taskId, newName);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, title: newName } : task
      ));
      return true;
    } catch (err) {
      console.error('Error updating task name:', err);
      setError(err.message);
      return false;
    }
  };

  const handleUpdateColumnName = async (columnId, newName) => {
    try {
      await updateColumnName(columnId, newName);
      setColumns(columns.map(column => 
        column.id === columnId ? { ...column, name: newName } : column
      ));

      const updatedColumn = columns.find(column => column.id === columnId);
      if (updatedColumn) {
        const oldKey = updatedColumn.name.toLowerCase().replace(/\s+/g, '-');
        const newKey = newName.toLowerCase().replace(/\s+/g, '-');
        
        setColumnMap(prevMap => {
          const newMap = { ...prevMap };
          if (newMap[oldKey]) {
            delete newMap[oldKey];
            newMap[newKey] = columnId;
          }
          return newMap;
        });
      }
      
      return true;
    } catch (err) {
      console.error('Error updating column name:', err);
      setError(err.message);
      return false;
    }
  };

  const handleUpdateRowName = async (rowId, newName) => {
    try {
      await updateRowName(rowId, newName);
      setRows(rows.map(row => 
        row.id === rowId ? { ...row, name: newName } : row
      ));
      return true;
    } catch (err) {
      console.error('Error updating row name:', err);
      setError(err.message);
      return false;
    }
  };

  const handleAddTask = async (title, rowId) => {
    try {
      if (!columns || columns.length === 0) {
        const errorMessage = 'Nie ma żadnej kolumny. Dodaj najpierw kolumnę.';
        setError(errorMessage);
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error(errorMessage);
      }
      
      const firstColumn = columns[0];
      const newTask = await addTask(title, firstColumn.id);
      
      if (rows.length > 0) {
        const targetRowId = rowId || rows[0].id;
        await updateTaskRow(newTask.id, targetRowId);
        
        const updatedTask = { ...newTask, rowId: targetRowId };
        setTasks(prevTasks => [...prevTasks, updatedTask]);
      } else {
        setTasks(prevTasks => [...prevTasks, newTask]);
      }
      
      await refreshTasks();
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleTaskReorder = async (draggedTaskId, targetTaskId) => {
    try {
      const draggedTask = tasks.find(t => t.id === draggedTaskId);
      const targetTask = tasks.find(t => t.id === targetTaskId);
      if (!draggedTask || !targetTask) return;

      if (draggedTask.columnId !== targetTask.columnId || 
          draggedTask.rowId !== targetTask.rowId) {
        return handleMoveTask(draggedTaskId, targetTask.columnId, targetTask.rowId);
      }
      
      const containerTasks = tasks.filter(
        t => t.columnId === targetTask.columnId && t.rowId === targetTask.rowId
      );
      
      const sortedTasks = [...containerTasks].sort((a, b) => 
        (a.position !== undefined && b.position !== undefined) 
          ? a.position - b.position 
          : 0
      );

      const draggedIndex = sortedTasks.findIndex(t => t.id === draggedTaskId);
      const targetIndex = sortedTasks.findIndex(t => t.id === targetTaskId);
      const newOrder = [...sortedTasks];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedTask);
      
      const updatedTasks = tasks.map(task => {
        const newIndex = newOrder.findIndex(t => t.id === task.id);
        if (newIndex !== -1) {
          return { ...task, position: newIndex };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      const updatePromises = newOrder.map(async (task, index) => {
        try {
          await updateTaskPosition(task.id, index);
        } catch (error) {
          console.error(`Error updating task position for ${task.id}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      await refreshTasks();
      
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError(err.message);
      throw err;
    }
  };

  const refreshTasks = async () => {
    try {
      const tasksData = await fetchTasks();
      setTasks(tasksData);
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const refreshBoard = async () => {
    try {
      setLoading(true);
      const columnsData = await fetchColumns();
      const sortedColumns = columnsData.sort((a, b) => a.position - b.position);
      setColumns(sortedColumns);
      const rowsData = await fetchRows();
      const sortedRows = rowsData.sort((a, b) => a.position - b.position);
      setRows(sortedRows);
      refreshTasks();
      setLoading(false);
    } catch (err) {
      console.error('Error refreshing board data:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  const handleAddColumn = async (name, wipLimit) => {
    try {
      const newColumn = await addColumn(name, wipLimit);
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
  
  const handleAddRow = async (name, wipLimit) => {
    try {
      const newRow = await addRow(name, wipLimit);
      setRows([...rows, newRow]);
      if (rows.length === 0) {
        const tasksToUpdate = tasks.filter(task => task.rowId === null || task.rowId === undefined);
        
        const updatedTasks = tasks.map(task => 
          (task.rowId === null || task.rowId === undefined)
            ? { ...task, rowId: newRow.id } 
            : task
        );
        
        setTasks(updatedTasks);
        tasksToUpdate.forEach(async (task) => {
          await updateTaskRow(task.id, newRow.id);
        });
      }
      
      return newRow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateWipLimit = async (columnId, newLimit) => {
    try {
      await updateColumnWipLimit(columnId, newLimit);
      const updatedColumns = await fetchColumns();
      const columnOrderMap = {};
      columns.forEach((col, index) => {
        columnOrderMap[col.id] = index;
      });
      
      const sortedUpdatedColumns = updatedColumns.sort((a, b) => a.position - b.position);
      
      setColumns(sortedUpdatedColumns);
    } catch (err) {
      console.error('Failed to update WIP limit:', err);
      setError('Failed to update WIP limit. Please try again.');
    }
  };

  const handlegetUserWipLimit = async (userId) => {
    try {
      return await getUserWipLimit(userId);
    } catch (err) {
      console.error('Error checking user WIP limit:', new Error(err.message));
      setError(err.message);
      throw err;
    }
  };

  const handleUpdateUserWipLimit = async (userId, wipLimit) => {
    try {
      const result = await updateUserWipLimit(userId, wipLimit);

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, wipLimit } : user
        )
      );
    
      return result;
    } catch (err) {
      console.error('Error updating user WIP limit:', err);
      setError(err.message);
      throw err;
    }
  };
  
  const handleUpdateRowWipLimit = async (rowId, newLimit) => {
    try {
      await updateRowWipLimit(rowId, newLimit);
      const updatedRows = await fetchRows();
      const sortedRows = updatedRows.sort((a, b) => a.position - b.position);
      setRows(sortedRows);
    } catch (err) {
      console.error('Failed to update row WIP limit:', err);
      setError('Failed to update row WIP limit. Please try again.');
    }
  };
  
  const handleDeleteColumn = async (columnId) => {
    try {
      const alternativeColumn = columns.find(col => col.id !== columnId);
      
      if (!alternativeColumn) {
        await deleteColumn(columnId);
        setColumns([]);
        return;
      }
      
      const tasksToMove = tasks.filter(task => task.columnId === columnId);
      for (const task of tasksToMove) {
        try {
          await updateTaskColumn(task.id, alternativeColumn.id);
        } catch (updateErr) {
          console.error(`Error updating task ${task.id} column:`, updateErr);
        }
      }
      
      await deleteColumn(columnId);
      const updatedColumnMap = { ...columnMap };
      for (const [key, value] of Object.entries(updatedColumnMap)) {
        if (value === columnId) {
          delete updatedColumnMap[key];
          break;
        }
      }
      setColumnMap(updatedColumnMap);
      setColumns(columns.filter(column => column.id !== columnId));

      const updatedTasks = tasks.map(task => 
        task.columnId === columnId 
          ? { ...task, columnId: alternativeColumn.id } 
          : task
      );
      
      setTasks(updatedTasks);
      await refreshTasks();
      
    } catch (err) {
      console.error('Error deleting column:', err);
      setError(err.message);
      throw err;
    }
  };
  
  const handleDeleteRow = async (rowId) => {
    try {
      const isLastRow = rows.length === 1;
      const tasksToUpdate = tasks.filter(task => task.rowId === rowId);
    
      if (!isLastRow) {
        const remainingRows = rows.filter(row => row.id !== rowId);
        const targetRowId = remainingRows[0].id;
      
        for (const task of tasksToUpdate) {
          await updateTaskRow(task.id, targetRowId);
        }
      
        await deleteRow(rowId);
        setRows(rows.filter(row => row.id !== rowId));
        const updatedTasks = tasks.map(task => 
          task.rowId === rowId ? { ...task, rowId: targetRowId } : task
        );
        setTasks(updatedTasks);
      } 
      else {
        for (const task of tasksToUpdate) {
          try {
            await updateTaskRow(task.id, null);
          } catch (updateErr) {
            console.error('Error updating task row to null:', updateErr);
          }
        }

        await deleteRow(rowId, true);
        setRows([]);
        const updatedTasks = tasks.map(task => 
          task.rowId === rowId ? { ...task, rowId: null } : task
        );
        setTasks(updatedTasks);
      }
      await refreshBoard();
    } catch (err) {
      console.error('Error deleting row:', err);
      setError(err.message);
      throw err;
    }
  };
  
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };
  
  const handleMoveTask = async (taskId, newColumnId, newRowId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      const columnChanged = newColumnId !== undefined && newColumnId !== task.columnId;
      const rowChanged = newRowId !== undefined && newRowId !== task.rowId;
      
      if (!columnChanged && !rowChanged) return;
      let updatedTask = { ...task };

      if (columnChanged) {
        await updateTaskColumn(taskId, newColumnId);
        updatedTask.columnId = newColumnId;
      }

      if (rowChanged) {
        await updateTaskRow(taskId, newRowId);
        updatedTask.rowId = newRowId;
      }
      
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleMoveColumn = async (columnId, targetColumnId) => {
    try {
      const columnIndex = columns.findIndex(col => col.id === columnId);
      const targetIndex = columns.findIndex(col => col.id === targetColumnId);
      
      if (columnIndex === -1 || targetIndex === -1) return;
      
      const newColumns = [...columns];
      const [movedColumn] = newColumns.splice(columnIndex, 1);
      newColumns.splice(targetIndex, 0, movedColumn);
      setColumns(newColumns);
      
      const updatePromises = newColumns.map(async (column, index) => {
        try {
          await updateColumnPosition(column.id, index);
        } catch (error) {
          console.error(`Error updating column position for ${column.id}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
    } catch (err) {
      console.error('Error moving column:', err);
      setError(err.message);
      throw err;
    }
  };

  const handleMoveRow = async (rowId, targetRowId) => {
    try {
      const rowIndex = rows.findIndex(row => row.id === rowId);
      const targetIndex = rows.findIndex(row => row.id === targetRowId);
      
      if (rowIndex === -1 || targetIndex === -1 || rowId === targetRowId) return;
      const newRows = [...rows];
      const [movedRow] = newRows.splice(rowIndex, 1);
      newRows.splice(targetIndex, 0, movedRow);
      
      setRows(newRows);
      
      const updatePromises = newRows.map(async (row, index) => {
        try {
          await updateRowPosition(row.id, index);
        } catch (error) {
          console.error(`Error updating row position for ${row.id}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
    } catch (err) {
      console.error('Error moving row:', err);
      setError(err.message);
      throw err;
    }
  };

  const handleDragStart = (e, id, type = 'task', sourceColumnId = null, sourceRowId = null) => {
    let data;
  
    if (type === 'task') {
      data = {
        id,
        type,
        sourceColumnId,
        sourceRowId
      };
    } else {
      data = { id, type };
    }
    
    const dataString = JSON.stringify(data);
    e.dataTransfer.setData(`application/${type}`, dataString);
    e.dataTransfer.setData('text/plain', dataString);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ id, type, sourceColumnId, sourceRowId });
    if (type === 'task') {
      e.dataTransfer.setData('taskId', id);
      e.dataTransfer.setData('columnId', sourceColumnId);
    }
  };

  const handleDrop = (e, targetColumnId, targetRowId) => {
    e.preventDefault();

    if (e.dataTransfer.types.includes('application/task')) {
      try {
        const dataString = e.dataTransfer.getData('application/task');
        const taskData = JSON.parse(dataString);
        const taskId = taskData.id;
        const sourceColumnId = taskData.sourceColumnId;
        const sourceRowId = taskData.sourceRowId;
        if (sourceColumnId === targetColumnId && sourceRowId === targetRowId) {
          return;
        }
        handleMoveTask(taskId, targetColumnId, targetRowId);
      } catch (err) {
        try {
          const taskId = e.dataTransfer.getData('taskId');
          const sourceColumnId = e.dataTransfer.getData('columnId');
        
          if (taskId && sourceColumnId !== targetColumnId) {
            handleMoveTask(taskId, targetColumnId, targetRowId);
          }
        } catch (fallbackErr) {
          console.error('Fallback error:', fallbackErr, err);
        }
      }
    }
    else if (e.dataTransfer.types.includes('application/column')) {
      try {
        const dataString = e.dataTransfer.getData('application/column');
        console.log('Column data string:', dataString);
      
        const columnData = JSON.parse(dataString);
        const columnId = columnData.id;
      
        if (columnId !== targetColumnId) {
          handleMoveColumn(columnId, targetColumnId);
        }
      } catch (err) {
        console.error('Error processing column drop:', err);
      }
    }
    else if (e.dataTransfer.types.includes('application/row')) {
      try {
        const dataString = e.dataTransfer.getData('application/row');
        const rowData = JSON.parse(dataString);
        const rowId = rowData.id;

        if (rowId !== targetRowId) {
          handleMoveRow(rowId, targetRowId);
        }
      } catch (err) {
        console.error('Error processing row drop:', err);
      }
    }
  
    setDraggedItem(null);
  };
  
  const handleDragOver = (e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  
  const dragAndDrop = {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleTaskReorder
  };
  
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
    refreshBoard,
    updateTaskName: handleUpdateTaskName,
    updateColumnName: handleUpdateColumnName,
    updateRowName: handleUpdateRowName,
    getUserWipLimit: handlegetUserWipLimit,
    updateUserWipLimit: handleUpdateUserWipLimit,
    dragAndDrop
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