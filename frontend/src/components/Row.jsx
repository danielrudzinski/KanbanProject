import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import EditableText from './EditableText';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import '../styles/components/Row.css';

function Row({ row, children }) {
  const { deleteRow, dragAndDrop, updateRowName } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const { handleDragStart, handleDragOver, handleDrop } = dragAndDrop;
  const { rows } = useKanban();
  const { t } = useTranslation();

  const handleDeleteClick = () => {
    if (rows.length > 1) {
      setIsConfirmingDelete(true);
    } else {
      toast.warning(t('row.lastRowWarning'));
    }
  };

  const handleConfirmDelete = () => {
    deleteRow(row.id);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };
  
  const onDragStart = (e) => {
    handleDragStart(e, row.id, 'row');
  };
  
  const onDragOver = (e) => {
    handleDragOver(e);
    e.currentTarget.classList.add('drag-over');
  };

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const onDrop = (e) => {
    handleDrop(e, null, row.id);
    e.currentTarget.classList.remove('drag-over');
  };

  const isOverLimit = row.taskCount > row.wipLimit;

  return (
    <div 
      className="row" 
      data-row-id={row.id}
      draggable="true"
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="row-header">
        <div className="header-left">
          <span className="row-drag-handle">☰</span>
          <EditableText 
            id={row.id} 
            text={row.name} 
            onUpdate={updateRowName} 
            className="row-name"
            inputClassName="row-name-input"
            type="row"
          />
          <span className="task-count">{row.taskCount || 0}</span>
          <button 
            className="delete-row-btn" 
            title="Usuń wiersz"
            onClick={handleDeleteClick}
          >
            ×
          </button>
        </div>

        {row.wipLimit > 0 && (
          <span className={`wip-limit ${isOverLimit ? 'exceeded' : ''}`}>
            {t('row.wipLimit')}: {row.wipLimit}
            {isOverLimit && ` (${t('row.wipExceeded')})`}
          </span>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="delete-confirmation">
          <p>{t('row.deleteConfirm')}</p>
          <div className="confirmation-buttons">
            <button onClick={handleConfirmDelete}>{t('taskActions.yes')}</button>
            <button onClick={handleCancelDelete}>{t('taskActions.no')}</button>
          </div>
        </div>
      )}

      <div className="row-content">
        {children}
      </div>
    </div>
  );
}

export default Row;