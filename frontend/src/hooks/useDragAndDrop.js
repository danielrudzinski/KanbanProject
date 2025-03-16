import { useState } from 'react';

const useDragAndDrop = (onMoveTask) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e, taskData) => {
        setIsDragging(true);
        e.dataTransfer.setData('application/json', JSON.stringify(taskData));
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        setIsDragging(false);
        e.target.classList.remove('dragging');
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

const handleDrop = async (e, targetColumnId, targetRowId = null) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    
    if (!data) {
        console.error('Drop event received empty data.');
        return;
    }

    try {
        const parsedData = JSON.parse(data);
        if (!parsedData.taskId) return;

        const { taskId, sourceColumnId, sourceRowId = null } = parsedData;

        if (sourceRowId === null || targetRowId === null) {
            await onMoveTask(taskId, targetColumnId);
        } else if (sourceColumnId !== targetColumnId || sourceRowId !== targetRowId) {
            await onMoveTask(taskId, targetColumnId, targetRowId);
        }
    } catch (error) {
        console.error('Error during drop:', error);
    }
};


    return {
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop
    };
};

export default useDragAndDrop;