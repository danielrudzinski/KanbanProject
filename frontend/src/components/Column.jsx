import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import Task from './Task';
import EditableText from './EditableText';
import '../styles/components/Column.css';

function Column({ column, tasks}) {
  const { deleteColumn, dragAndDrop, updateColumnName } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const { handleDragOver, handleDrop } = dragAndDrop;

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
    e.preventDefault();
    setIsDragOver(true);
    handleDragOver(e);
  };
  
  const onDragLeave = () => {
    setIsDragOver(false);
  };
  
  const onDrop = (e) => {
    console.log('Column drop event on column:', column.id);
    setIsDragOver(false);
    handleDrop(e, column.id, null);
  };
  
  const onDragStart = (e) => {
    console.log('Column drag start:', column.id);
    const data = { id: column.id, type: 'column' };
    const dataString = JSON.stringify(data);
    e.dataTransfer.setData('application/column', dataString);
    e.dataTransfer.setData('text/plain', dataString);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className={`column ${isOverLimit ? 'over-limit' : ''} ${isDragOver ? 'drag-over' : ''}`} 
      data-column-id={column.id}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      draggable="true"
      onDragStart={onDragStart}
    >
      <div className="column-header">
        <div className="header-top">
          <span className="column-drag-handle">☰</span>
          <EditableText 
            id={column.id} 
            text={column.name} 
            onUpdate={updateColumnName} 
            className="column-name"
            inputClassName="column-name-input"
            type="column"
          />
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
        className={`task-list ${isDragOver ? 'drag-over' : ''}`} 
        data-column-id={column.id}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
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