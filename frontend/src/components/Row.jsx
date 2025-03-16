import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/Row.css';

function Row({ row, children }) {
  const { deleteRow } = useKanban();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDeleteClick = () => {
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    deleteRow(row.id);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  return (
    <div 
      className="row" 
      data-row-id={row.id}
    >
      <div className="row-header">
        <div className="header-left">
          {row.name}
          <span className="task-count">{row.taskCount || 0}</span>
          <button 
            className="delete-row-btn" 
            title="Usuń wiersz"
            onClick={handleDeleteClick}
          >
            ×
          </button>
        </div>

        {row.wipLimit > 0 && (
          <span className={`wip-limit ${row.isOverLimit ? 'exceeded' : ''}`}>
            Limit: {row.wipLimit}
            {row.isOverLimit && ' (przekroczony!)'}
          </span>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="delete-confirmation">
          <p>Czy na pewno chcesz usunąć ten wiersz?</p>
          <div className="confirmation-buttons">
            <button onClick={handleConfirmDelete}>Tak</button>
            <button onClick={handleCancelDelete}>Nie</button>
          </div>
        </div>
      )}

      <div className="row-content">
        {children}
      </div>
    </div>
  );
}

export default Row;