import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useTranslation } from 'react-i18next';
import '../styles/components/Forms.css'; 
import FormModal from './FormModal';

function AddTaskForm({ onClose, defaultColumnId = '', defaultRowId = '' }) {
  const { addTask, refreshTasks, columns, rows } = useKanban();
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColumnId, setSelectedColumnId] = useState(defaultColumnId || '');
  const [selectedRowId, setSelectedRowId] = useState(defaultRowId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError(t('forms.addTaskForm.titleRequired'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
  await addTask(title, selectedColumnId || null, deadline || null, selectedRowId || null);
      await refreshTasks();
      
      setTitle('');
      setDeadline('');
      setSelectedColumnId('');
  setSelectedRowId('');
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || t('forms.addTaskForm.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <FormModal onClose={onClose} ariaLabel={t('forms.addTaskForm.title')}>
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>{t('forms.addTaskForm.title')}</h3>
          <button 
            type="button" 
            className="close-button" 
            onClick={onClose}
            aria-label={t('forms.addRowColumn.close')}
          >
            ×
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="task-title">{t('forms.addTaskForm.titleLabel')}</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('forms.addTaskForm.titlePlaceholder')}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="task-column">{t('forms.addTaskForm.columnLabel')}</label>
          <select
            id="task-column"
            value={selectedColumnId}
            onChange={(e) => setSelectedColumnId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">{t('forms.addTaskForm.selectColumn')}</option>
            {columns && columns.map(column => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
          <small className="help-text">{t('forms.addTaskForm.columnHelp', 'Optional. Tasks without a column will appear in the backlog.')}</small>
        </div>

        {rows && rows.length > 0 && (
          <div className="form-group">
            <label htmlFor="task-row">{t('forms.addTaskForm.rowLabel', 'Row')}</label>
            <select
              id="task-row"
              value={selectedRowId}
              onChange={(e) => setSelectedRowId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{t('forms.addTaskForm.selectRow', 'Select row')}</option>
              {rows.map(row => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
            <small className="help-text">{t('forms.addTaskForm.rowHelp', 'Optional. Defaults to the first row if none is selected.')}</small>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="task-deadline">{t('forms.addTaskForm.deadlineLabel', 'Deadline')}</label>
          <input
            id="task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            disabled={isSubmitting}
            className="deadline-input"
          />
          <small className="help-text">{t('forms.addTaskForm.deadlineHelp', 'Optional. Tasks will be marked as expired when the deadline passes.')}</small>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('forms.addTaskForm.adding') : t('header.addTask')}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('taskActions.cancel')}
          </button>
        </div>
      </form>
    </div>
    </FormModal>
  );
}

export default AddTaskForm;