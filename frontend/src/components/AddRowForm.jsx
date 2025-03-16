import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';

function AddRowForm({ onClose }) {
  const [name, setName] = useState('');
  const [wipLimit, setWipLimit] = useState(0);
  const [error, setError] = useState('');
  const { addRow } = useKanban();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Nazwa wiersza nie może być pusta');
      return;
    }
    
    try {
      await addRow(name, wipLimit);
      setName('');
      setWipLimit(0);
      onClose();
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas dodawania wiersza');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-row-form">
        <h2>Dodaj nowy wiersz</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="row-name">Nazwa wiersza:</label>
            <input
              type="text"
              id="row-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Cechy, Funkcje, Projekty"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="wip-limit">Limit WIP (0 = brak limitu):</label>
            <input
              type="number"
              id="wip-limit"
              min="0"
              value={wipLimit}
              onChange={(e) => setWipLimit(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div className="form-buttons">
            <button type="submit" className="submit-btn">Dodaj wiersz</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Anuluj</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddRowForm;