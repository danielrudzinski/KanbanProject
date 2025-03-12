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

    const handleDrop = async (e, targetColumnId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        
        try {
            const { taskId, sourceColumnId } = JSON.parse(data);
            
            if (sourceColumnId !== targetColumnId) {
                await onMoveTask(taskId, targetColumnId);
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