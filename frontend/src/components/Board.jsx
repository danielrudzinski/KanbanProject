import { useKanban } from '../context/KanbanContext';
import { useEffect } from 'react';
import Column from './Column';
import Task from './Task';
import '../styles/components/Board.css';

function Board() {
  const { columns, rows, tasks, loading, error, deleteRow, dragAndDrop } = useKanban();
  const { handleDragOver } = dragAndDrop;

  if (loading) {
    return <div className="board-loading">Loading kanban board...</div>;
  }

  if (error) {
    return <div className="board-error">Error: {error}</div>;
  }

  useEffect(() => {
    // Set CSS variable for column count
    if (columns.length > 0) {
      document.documentElement.style.setProperty('--column-count', columns.length);
    }
    
    return () => {
      // Reset when component unmounts
      document.documentElement.style.setProperty('--column-count', 3);
    };
  }, [columns.length, rows.length]);

  // Filter tasks by column and optionally by row
  const getTasksByColumnAndRow = (columnId, rowId = null) => {
    if (rowId === null) {
      return tasks.filter(task => 
        task.columnId === columnId && 
        (task.rowId === null || task.rowId === undefined)
      );
    }
    
    return tasks.filter(task => 
      task.columnId === columnId && task.rowId === rowId
    );
  };

  // Calculate task counts for each row
  const calculateTaskCounts = () => {
    const counts = {};
    rows.forEach(row => {
      counts[row.id] = tasks.filter(task => task.rowId === row.id).length;
    });
    return counts;
  };

  const taskCounts = calculateTaskCounts();

  // Check if any row is over its WIP limit
  const checkRowWipLimits = () => {
    const rowStatus = {};
    rows.forEach(row => {
      if (row.wipLimit > 0) {
        const rowTaskCount = taskCounts[row.id] || 0;
        rowStatus[row.id] = rowTaskCount > row.wipLimit;
      }
    });
    return rowStatus;
  };

  const rowWipStatus = checkRowWipLimits();

  // Enhance row objects with additional properties
  const enhancedRows = rows.map(row => ({
    ...row,
    taskCount: taskCounts[row.id] || 0,
    isOverLimit: rowWipStatus[row.id] || false
  }));

  // Handle column drag over for the board itself
  const onBoardDragOver = (e) => {
    handleDragOver(e);
    
    // For column reordering
    if (e.dataTransfer.types.includes('application/column')) {
      e.preventDefault();
    }
  };

  // If no rows, render the board with just columns
  if (rows.length === 0) {
    return (
      <div 
        className="board"
        onDragOver={onBoardDragOver}
      >
        {columns.map(column => (
          <Column 
            key={column.id}
            column={column}
            tasks={getTasksByColumnAndRow(column.id)}
          />
        ))}
      </div>
    );
  }

  // Otherwise, render the grid-based board with rows and columns
  return (
    <div className="board-grid">
      <table className="kanban-table">
        <thead>
          <tr>
            {/* Top-left empty cell */}
            <th className="grid-corner"></th>
            
            {/* Column headers */}
            {columns.map(column => (
              <th key={column.id} className="grid-column-header">
                <div className="column-title">{column.name}</div>
                {column.wipLimit > 0 && (
                  <span className={`wip-limit ${tasks.filter(t => t.columnId === column.id).length > column.wipLimit ? 'exceeded' : ''}`}>
                    ({tasks.filter(t => t.columnId === column.id).length}/{column.wipLimit})
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Uncategorized row */}
          <tr>
            <td className="grid-row-header">Bez kategorii</td>
            
            {/* Uncategorized row cells */}
            {columns.map(column => (
              <td 
                key={`uncategorized-${column.id}`} 
                className="grid-cell"
                data-column-id={column.id}
              >
                {getTasksByColumnAndRow(column.id, null).map(task => (
                  <Task 
                    key={task.id} 
                    task={task}
                    columnId={column.id} 
                  />
                ))}
              </td>
            ))}
          </tr>
          
          {/* Rows with headers and cells */}
          {enhancedRows.map(row => (
            <tr key={row.id}>
              {/* Row header */}
              <td 
                className="grid-row-header"
              >
                <div className="row-title">{row.name}</div>
                <div className="row-actions">
                  <span className="task-count">{row.taskCount || 0}</span>
                  {row.wipLimit > 0 && (
                    <span className={`wip-limit ${row.isOverLimit ? 'exceeded' : ''}`}>
                      ({row.taskCount || 0}/{row.wipLimit})
                    </span>
                  )}
                  <button 
                    className="delete-row-btn" 
                    title="Usuń wiersz"
                    onClick={() => {
                      if (window.confirm('Czy na pewno chcesz usunąć ten wiersz?')) {
                        deleteRow(row.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              </td>
              
              {/* Row cells */}
              {columns.map(column => (
                <td 
                  key={`${row.id}-${column.id}`} 
                  className="grid-cell"
                  data-column-id={column.id}
                  data-row-id={row.id}
                >
                  {getTasksByColumnAndRow(column.id, row.id).map(task => (
                    <Task 
                      key={task.id} 
                      task={task}
                      columnId={column.id} 
                    />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Board;