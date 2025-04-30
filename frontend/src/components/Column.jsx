import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import Task from './Task';
import EditableText from './EditableText';
import { useTranslation } from 'react-i18next';
import '../styles/components/Column.css';

function Column({ column, tasks}) {
  const { deleteColumn, dragAndDrop, updateColumnName } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useTranslation();
  
  const { handleDragOver, handleDrop, handleDragStart } = dragAndDrop;

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
    handleDragStart(e, column.id, 'column');
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
            title={t('taskActions.delete')}
            onClick={handleDeleteClick}
          >
            ×
          </button>
        </div>

        {column.wipLimit > 0 && (
          <span className={`wip-limit ${isOverLimit ? 'exceeded' : ''}`}>
            {t('column.wipLimit')}: {column.wipLimit}
            {isOverLimit && ` (${t('column.wipExceeded')})`}
          </span>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="delete-confirmation">
          <p>{t('column.deleteConfirm')}</p>
          <div className="confirmation-buttons">
            <button onClick={handleConfirmDelete}>{t('taskActions.yes')}</button>
            <button onClick={handleCancelDelete}>{t('taskActions.no')}</button>
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