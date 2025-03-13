import { useState } from 'react';
import { useKanban } from '../context/KanbanContext';
import '../styles/components/AddTaskForm.css';

function AddTaskForm() {
  const { addTask, refreshTasks } = useKanban();
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const toggleForm = () => {
    onClose();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Tytuł zadania jest wymagany!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await addTask(title);
      await refreshTasks();
      
      // Reset form
      setTitle('');
    } catch (err) {
      setError(err.message || 'Wystąpił błąd podczas dodawania zadania');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="add-task-container">
      <form onSubmit={handleSubmit}>
        <h3>Dodaj nowe zadanie</h3>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wpisz tytuł zadania"
            disabled={isSubmitting}
          />
          
          <button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Dodawanie...' : 'Dodaj zadanie'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTaskForm;