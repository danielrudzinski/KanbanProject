import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useTranslation } from 'react-i18next';
import '../styles/components/Forms.css';

function WipLimitControl({ onClose }) {
  const { columns, rows, updateWipLimit, updateRowWipLimit } = useKanban();
  const [selectedItem, setSelectedItem] = useState('');
  const [wipLimit, setWipLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('column'); // 'column' or 'row'
  const { t } = useTranslation();
  
  const handleItemChange = (e) => {
    const itemId = e.target.value;
    setSelectedItem(itemId);
    
    if (itemId) {
      if (activeTab === 'column') {
        const column = columns.find(col => col.id === itemId);
        if (column) {
          setWipLimit(column.wipLimit.toString());
        }
      } else {
        const row = rows.find(r => r.id === itemId);
        if (row) {
          setWipLimit(row.wipLimit.toString());
        }
      }
    } else {
      setWipLimit('');
    }
  };
  
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSelectedItem('');
    setWipLimit('');
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) {
      setError(activeTab === 'column' 
        ? t('forms.wipLimit.error.selectRequired', { type: t('forms.wipLimit.columnTab').toLowerCase() }) 
        : t('forms.wipLimit.error.selectRequired', { type: t('forms.wipLimit.rowTab').toLowerCase() })
      );
      return;
    }
    
    const parsedLimit = Number(wipLimit);
    if (wipLimit.trim() === '' || isNaN(parsedLimit) || parsedLimit < 0) {
      setError(t('forms.wipLimit.error.invalidLimit'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      if (activeTab === 'column') {
        await updateWipLimit(selectedItem, parsedLimit);
      } else {
        await updateRowWipLimit(selectedItem, parsedLimit);
      }
      
      setSelectedItem('');
      setWipLimit('');
      
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || t('notifications.errorOccurred', { message: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const hasItems = activeTab === 'column' ? columns.length > 0 : rows.length > 0;
  if (!hasItems && (columns.length === 0 && rows.length === 0)) {
    return null;
  }
  
  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} role="form">
        <div className="form-header">
          <h3>{t('forms.wipLimit.title')}</h3>
          <button 
            type="button" 
            className="close-button" 
            onClick={onClose}
            aria-label={t('forms.wipLimit.close')}
          >
            ×
          </button>
        </div>
        
        <div className="tab-container">
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'column' ? 'active' : ''}`}
            onClick={() => switchTab('column')}
            disabled={columns.length === 0}
          >
            {t('forms.wipLimit.columnTab')}
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'row' ? 'active' : ''}`}
            onClick={() => switchTab('row')}
            disabled={rows.length === 0}
          >
            {t('forms.wipLimit.rowTab')}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="item-select">
            {activeTab === 'column' ? 'Wybierz kolumnę:' : 'Wybierz wiersz:'}
          </label>
          <select
            id="item-select"
            value={selectedItem}
            onChange={handleItemChange}
            disabled={isSubmitting}
          >
            <option value="">
              {activeTab === 'column' ? 'Wybierz kolumnę' : 'Wybierz wiersz'}
            </option>
            {activeTab === 'column' ? (
              columns.map(column => (
                <option key={column.id} value={column.id}>
                  {column.name} 
                  {column.wipLimit > 0 ? ` (Aktualny limit: ${column.wipLimit})` : ' (Bez limitu)'}
                </option>
              ))
            ) : (
              rows.map(row => (
                <option key={row.id} value={row.id}>
                  {row.name} 
                  {row.wipLimit > 0 ? ` (Aktualny limit: ${row.wipLimit})` : ' (Bez limitu)'}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="wip-limit">
            Limit WIP <span className="help-text">(0 = bez limitu)</span>
          </label>
          <input
            id="wip-limit"
            type="number"
            min="0"
            value={wipLimit}
            onChange={(e) => setWipLimit(e.target.value)}
            placeholder="0"
            disabled={isSubmitting || !selectedItem}
            onInput={(e) => {
              if (e.target.value < 0) {
                e.target.value = 0;
                setWipLimit("0"); 
              }
            }}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit"
            disabled={isSubmitting || !selectedItem}
          >
            {isSubmitting ? t('forms.wipLimit.submitting') : t('forms.wipLimit.submit')}
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
  );
}

export default WipLimitControl;