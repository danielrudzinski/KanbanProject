import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/Forms.css';

function AddRowForm() {
  const { addRow } = useKanban();
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nazwa wiersza nie może być pusta');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await addRow(name, parseInt(wipLimit) || 0);
      
      // Reset form
      setName('');
      setWipLimit('0');
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas dodawania wiersza');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>Dodaj nowy wiersz</h3>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="row-name">Nazwa wiersza:</label>
          <input
            id="row-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. Cechy, Funkcje, Projekty"
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
            {isSubmitting ? 'Dodawanie...' : 'Dodaj wiersz'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddRowForm;