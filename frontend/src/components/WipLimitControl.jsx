import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/WipLimitControl.css';

function WipLimitControl() {
  const { columns, updateWipLimit } = useKanban();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [wipLimit, setWipLimit] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Find column by id
  const getSelectedColumn = () => {
    return columns.find(column => column.id === selectedColumn);
  };
  
  // Toggle form visibility
  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    setError(null);
    
    if (isFormVisible) {
      setSelectedColumn('');
      setWipLimit('');
      onClose();
    }
  };
  
  // Handle column selection
  const handleColumnChange = (e) => {
    const columnId = e.target.value;
    setSelectedColumn(columnId);
    
    // Pre-fill current WIP limit
    if (columnId) {
      const column = columns.find(col => col.id === columnId);
      if (column) {
        setWipLimit(column.wipLimit.toString());
      }
    } else {
      setWipLimit('');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedColumn) {
      setError('Wybierz kolumnę!');
      return;
    }
    
    if (wipLimit === '' || wipLimit < 0) {
      setError('Podaj prawidłowy limit WIP (liczba większa lub równa 0)');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateWipLimit(selectedColumn, parseInt(wipLimit));
      
      setIsFormVisible(false);
      setSelectedColumn('');
      setWipLimit('');
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas aktualizacji limitu WIP');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Don't render if no columns available
  if (!columns.length) {
    return null;
  }
  
  return (
    <div className="wip-limit-container">
      {!isFormVisible ? (
        <button 
          className="toggle-form-btn"
          onClick={toggleForm}
        >
          Ustaw limit WIP
        </button>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h3>Ustaw limit WIP</h3>
              <button 
                type="button" 
                className="close-form-btn"
                onClick={toggleForm}
              >
                ×
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="column-select">Wybierz kolumnę:</label>
              <select
                id="column-select"
                value={selectedColumn}
                onChange={handleColumnChange}
                disabled={isSubmitting}
              >
                <option value="">Wybierz kolumnę</option>
                {columns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.name} 
                    {column.wipLimit > 0 ? ` (Aktualny limit: ${column.wipLimit})` : ' (Bez limitu)'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="wip-limit">
                Limit WIP:
                <span className="help-text">0 = bez limitu</span>
              </label>
              <input
                id="wip-limit"
                type="number"
                min="0"
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="0"
                disabled={isSubmitting || !selectedColumn}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit"
                disabled={isSubmitting || !selectedColumn}
              >
                {isSubmitting ? 'Aktualizowanie...' : 'Ustaw limit'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default WipLimitControl;