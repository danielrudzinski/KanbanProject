import React, { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/Forms.css';

function AddRowColumnForm({ onClose }) {
  const { addColumn, addRow } = useKanban();
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('column'); // Default to column

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(`Nazwa ${activeTab === 'column' ? 'kolumny' : 'wiersza'} jest wymagana!`);
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
      
      // Reset form
      setName('');
      setWipLimit('0');
      
      // Close form after successful submission
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || `Wystąpił błąd podczas dodawania ${activeTab === 'column' ? 'kolumny' : 'wiersza'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch between column and row tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setName('');
    setWipLimit('0');
    setError(null);
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>Dodaj nowy wiersz/kolumnę</h3>
          <button 
            type="button" 
            className="close-button" 
            onClick={onClose}
            aria-label="Zamknij formularz"
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
            Kolumny
          </button>
          <button 
            type="button" 
            className={`tab-btn ${activeTab === 'row' ? 'active' : ''}`}
            onClick={() => switchTab('row')}
          >
            Wiersze
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="item-name">
            Nazwa {activeTab === 'column' ? 'kolumny' : 'wiersza'}:
          </label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={activeTab === 'column' ? 'np. To Do' : 'np. Cechy, Funkcje, Projekty'}
            disabled={isSubmitting}
          />
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
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Dodawanie...' : `Dodaj ${activeTab === 'column' ? 'kolumnę' : 'wiersz'}`}
          </button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddRowColumnForm;