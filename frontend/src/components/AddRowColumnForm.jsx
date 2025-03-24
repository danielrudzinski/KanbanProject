import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/Forms.css';

function AddRowColumnForm({ onClose }) {
  const { addColumn, addRow } = useKanban();
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [itemType, setItemType] = useState('column'); // Default to column

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(`Nazwa ${itemType === 'column' ? 'kolumny' : 'wiersza'} jest wymagana!`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (itemType === 'column') {
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
      setError(err.message || `Wystąpił błąd podczas dodawania ${itemType === 'column' ? 'kolumny' : 'wiersza'}`);
    } finally {
      setIsSubmitting(false);
    }
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
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label>Wybierz typ:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="itemType"
                value="column"
                checked={itemType === 'column'}
                onChange={() => setItemType('column')}
                disabled={isSubmitting}
              />
              Kolumna
            </label>
            <label>
              <input
                type="radio"
                name="itemType"
                value="row"
                checked={itemType === 'row'}
                onChange={() => setItemType('row')}
                disabled={isSubmitting}
              />
              Wiersz
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="item-name">
            Nazwa {itemType === 'column' ? 'kolumny' : 'wiersza'}:
          </label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={itemType === 'column' ? 'np. To Do' : 'np. Cechy, Funkcje, Projekty'}
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
            {isSubmitting ? 'Dodawanie...' : `Dodaj ${itemType === 'column' ? 'kolumnę' : 'wiersz'}`}
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