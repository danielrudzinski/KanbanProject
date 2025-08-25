import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useTranslation } from 'react-i18next';
import '../styles/components/Forms.css';
import FormModal from './FormModal';

function AddRowColumnForm({ onClose, defaultTab = 'column' }) {
  const { addColumn, addRow } = useKanban();
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(defaultTab); // Default to column
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t(`forms.addRowColumn.error.nameRequired.${activeTab}`));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (activeTab === 'column') {
        await addColumn(name, wipLimit);
      } else {
        await addRow(name, parseInt(wipLimit) || 0);
      }
      
      setName('');
      setWipLimit('0');

      if (onClose) onClose();
    } catch (err) {
      setError(err.message || t(`forms.addRowColumn.error.addFailed.${activeTab}`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setName('');
    setWipLimit('0');
    setError(null);
  };

  return (
    <FormModal onClose={onClose} ariaLabel={t('forms.addRowColumn.title')}>
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>{t('forms.addRowColumn.title')}</h3>
          <button 
            type="button" 
            className="close-button" 
            onClick={onClose}
            aria-label={t('forms.addRowColumn.close')}
          >
            ×
          </button>
        </div>
        
        <div className="tab-container">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'column' ? 'active' : ''}`}
            onClick={() => switchTab('column')}
          >
            {t('forms.addRowColumn.tabs.columns')}
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'row' ? 'active' : ''}`}
            onClick={() => switchTab('row')}
          >
            {t('forms.addRowColumn.tabs.rows')}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="item-name">
            {t(`forms.addRowColumn.nameLabel.${activeTab}`)}
          </label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t(`forms.addRowColumn.placeholder.${activeTab}`)}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="wip-limit">
            {t('forms.wipLimit.limitLabel')} <span className="help-text">({t('forms.wipLimit.noLimit')})</span>
          </label>
          <input
            id="wip-limit"
            type="number"
            min="0"
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            placeholder="0"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('forms.addRowColumn.submitting') : t(`forms.addRowColumn.submit.${activeTab}`)}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('forms.wipLimit.cancel')}
          </button>
        </div>
      </form>
    </div>
  </FormModal>
  );
}

export default AddRowColumnForm;