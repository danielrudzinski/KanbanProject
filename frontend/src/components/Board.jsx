import { useKanban } from '../context/KanbanContext';
import Column from './Column';
import '../styles/components/Board.css';

function Board() {
  const { columns, tasks, loading, error } = useKanban();

  if (loading) {
    return <div className="board-loading">Loading kanban board...</div>;
  }

  if (error) {
    return <div className="board-error">Error: {error}</div>;
  }

  // Filter tasks by column
  const getTasksByColumn = (columnId) => {
    return tasks.filter(task => task.columnId === columnId);
  };

  return (
    <div className="board">
      {columns.map(column => (
        <Column 
          key={column.id}
          column={column}
          tasks={getTasksByColumn(column.id)}
        />
      ))}
    </div>
  );
}

export default Board;