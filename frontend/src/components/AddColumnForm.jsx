import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/Forms.css';

function AddColumnForm() {
  const { addColumn } = useKanban();
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Nazwa kolumny jest wymagana!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await addColumn(name, wipLimit);
      
      // Reset form
      setName('');
      setWipLimit('');
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas dodawania kolumny');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>Dodaj nową kolumnę</h3>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="column-name">Nazwa kolumny:</label>
          <input
            id="column-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="np. To Do"
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
            {isSubmitting ? 'Dodawanie...' : 'Dodaj kolumnę'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddColumnForm;