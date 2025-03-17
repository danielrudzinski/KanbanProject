import { useState, useCallback } from 'react';

const useDragAndDrop = (moveTask, moveColumn, moveRow) => {
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Handle drag start
  const handleDragStart = useCallback((e, id, type, sourceColumnId, sourceRowId) => {
    // Set the data transfer
    const data = {
      id,
      type,
      sourceColumnId,
      sourceRowId
    };
    
    e.dataTransfer.setData(`application/${type}`, JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ id, type });
    
    // For columns and rows, set specific data type
    if (type === 'column') {
      e.dataTransfer.setData('application/column', id);
    } else if (type === 'row') {
      e.dataTransfer.setData('application/row', id);
    }
  }, []);
  
  // Handle drag over
  const handleDragOver = useCallback((e) => {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary to allow dropping
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
  }, []);
  
  // Handle drop
  const handleDrop = useCallback((e, targetColumnId, targetRowId) => {
    e.preventDefault();
    
    // Check if we're dropping a task
    if (e.dataTransfer.types.includes('application/task')) {
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/task'));
        const taskId = data.id;
        
        // If source and target are the same, do nothing
        if (data.sourceColumnId === targetColumnId && data.sourceRowId === targetRowId) {
          return;
        }
        
        // Move the task
        moveTask(taskId, targetColumnId, targetRowId);
      } catch (err) {
        console.error('Error dropping task:', err);
      }
    }
    
    // Check if we're dropping a column
    else if (e.dataTransfer.types.includes('application/column')) {
      try {
        const columnId = e.dataTransfer.getData('application/column');
        
        // Don't drop on itself
        if (columnId !== targetColumnId) {
          moveColumn(columnId, targetColumnId);
        }
      } catch (err) {
        console.error('Error dropping column:', err);
      }
    }
    
    // Check if we're dropping a row
    else if (e.dataTransfer.types.includes('application/row')) {
      try {
        const rowId = e.dataTransfer.getData('application/row');
        
        // Don't drop on itself
        if (rowId !== targetRowId) {
          moveRow(rowId, targetRowId);
        }
      } catch (err) {
        console.error('Error dropping row:', err);
      }
    }
    
    setDraggedItem(null);
  }, [moveTask, moveColumn, moveRow]);
  
  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
};

export default useDragAndDrop;