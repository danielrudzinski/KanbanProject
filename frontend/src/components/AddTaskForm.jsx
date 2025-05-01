import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useTranslation } from 'react-i18next';
import '../styles/components/Forms.css'; 

function AddTaskForm({ onClose }) {
  const { addTask, refreshTasks } = useKanban();
  const [title, setTitle] = useState('');
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
      
      await addTask(title);
      await refreshTasks();
      
      setTitle('');
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || t('forms.addTaskForm.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
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
  );
}

export default AddTaskForm;