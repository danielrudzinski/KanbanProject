import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import Task from './Task';
import '../styles/components/Column.css';

function Column({ column, tasks}) {
  const { deleteColumn, dragAndDrop } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const { handleDragStart, handleDragOver, handleDrop } = dragAndDrop;

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

  const onDragOver = (e) => {
    handleDragOver(e);
  };
  
  const onDrop = (e) => {
    handleDrop(e, column.id);
  };
  
  const onDragStart = (e) => {
    handleDragStart(e, column.id, 'column');
  };

  return (
    <div 
      className={`column ${isOverLimit ? 'over-limit' : ''}`} 
      data-column-id={column.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
      draggable="true"
      onDragStart={onDragStart}
    >
      <div className="column-header">
        <div className="header-top">
          <span className="column-drag-handle">☰</span>
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
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {tasks.map(task => (
          <Task 
            key={task.id} 
            task={task}
            columnId={column.id}
            rowId={null}
          />
        ))}
      </div>
    </div>
  );
}

export default Column;