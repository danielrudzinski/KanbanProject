import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import Task from './Task';
import useDragAndDrop from '../hooks/useDragAndDrop';
import '../styles/components/Column.css';

function Column({ column, tasks }) {
  const { deleteColumn, moveTask } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Use drag and drop hook
  const { handleDragOver, handleDrop } = useDragAndDrop(moveTask);

  const isOverLimit = column.wipLimit > 0 && tasks.length > column.wipLimit;

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    deleteColumn(column.id);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  return (
    <div 
    className={`column ${isOverLimit ? 'over-limit' : ''}`} 
    data-column-id={column.id}
    onDragOver={handleDragOver}
    onDrop={(e) => handleDrop(e, column.id)}
    >
      <div className="column-header">
        <div className="header-top">
          {column.name}
          <span className="task-count">{tasks.length}</span>
          <button 
            className="delete-column-btn" 
            title="Usuń kolumnę"
            onClick={handleDeleteClick}
          >
            ×
          </button>
        </div>

        {column.wipLimit > 0 && (
          <span className={`wip-limit ${isOverLimit ? 'exceeded' : ''}`}>
            Limit: {column.wipLimit}
            {isOverLimit && ' (przekroczony!)'}
          </span>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="delete-confirmation">
          <p>Czy na pewno chcesz usunąć tę kolumnę?</p>
          <div className="confirmation-buttons">
            <button onClick={handleConfirmDelete}>Tak</button>
            <button onClick={handleCancelDelete}>Nie</button>
          </div>
        </div>
      )}

      <div 
        className="task-list" 
        data-column-id={column.id}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, column.id)}
      >
        {tasks.map(task => (
          <Task 
            key={task.id} 
            task={task}
            columnId={column.id} 
          />
        ))}
      </div>
    </div>
  );
}

export default Column;
