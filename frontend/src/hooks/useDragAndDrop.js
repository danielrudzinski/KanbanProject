import { useState, useCallback } from 'react';

const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  
  const handleDragStart = useCallback((e, data) => {
    // For tasks, data should be an object with taskId and sourceColumnId
    // For columns, data should be the columnId
    // For rows, data should be the rowId
    
    const type = data.type || (typeof data === 'object' ? 'task' : 'entity');
    const payload = typeof data === 'object' ? JSON.stringify(data) : data;
    
    e.dataTransfer.setData(`application/${type}`, payload);
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggedItem(data);
    
    if (data.taskId) {
      e.dataTransfer.setData('application/task', payload);
    } else if (data.type === 'column') {
      e.dataTransfer.setData('application/column', data.id);
    } else if (data.type === 'row') {
      e.dataTransfer.setData('application/row', data.id);
    }
  }, []);
  
  const handleDragOver = useCallback((e) => {
    if (e.preventDefault) {
      e.preventDefault(); 
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);
  
  return {
    draggedItem,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
};

export default useDragAndDrop;