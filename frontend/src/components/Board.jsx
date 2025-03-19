import { useKanban } from '../context/KanbanContext';
import { useEffect } from 'react';
import Column from './Column';
import Task from './Task';
import '../styles/components/Board.css';

function Board() {
  const { columns, rows, tasks, loading, error, deleteRow, dragAndDrop } = useKanban();
  const { handleDragOver, handleDrop } = dragAndDrop;

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
  if (rows.length > 0) {
    if (rowId === null) {
      return tasks.filter(task => 
        task.columnId === columnId && (task.rowId === null || task.rowId === undefined)
      );
    } else {
      return tasks.filter(task => 
        task.columnId === columnId && task.rowId === rowId
      );
    }
  }
  
  return tasks.filter(task => task.columnId === columnId);
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

  // Render the row header with drag and drop handlers
  const renderRowHeader = (row) => {
    const onDragStart = (e) => {
      dragAndDrop.handleDragStart(e, row.id, 'row');
    };
    
    const onDragOver = (e) => {
      dragAndDrop.handleDragOver(e);
    };
    
    const onDrop = (e) => {
      dragAndDrop.handleDrop(e, null, row.id);
    };
    
    return (
      <td 
        className="grid-row-header"
        draggable="true"
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-row-id={row.id}
      >
        <div className="row-title">
          <span className="row-drag-handle">☰</span>
          {row.name}
        </div>
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
    );
  };

  // Render column header with drag and drop handlers
  const renderColumnHeader = (column) => {
    const onDragStart = (e) => {
      dragAndDrop.handleDragStart(e, column.id, 'column');
    };
    
    const onDragOver = (e) => {
      dragAndDrop.handleDragOver(e);
    };
    
    const onDrop = (e) => {
      dragAndDrop.handleDrop(e, column.id);
    };
    
    return (
      <th 
        key={column.id} 
        className="grid-column-header"
        draggable="true"
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        data-column-id={column.id}
      >
        <div className="column-title">
          <span className="column-drag-handle">☰</span>
          {column.name}
        </div>
        {column.wipLimit > 0 && (
          <span className={`wip-limit ${tasks.filter(t => t.columnId === column.id).length > column.wipLimit ? 'exceeded' : ''}`}>
            ({tasks.filter(t => t.columnId === column.id).length}/{column.wipLimit})
          </span>
        )}
      </th>
    );
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

  // Render table cells with proper drag and drop handlers
  const renderCell = (column, row) => {
    const cellTasks = getTasksByColumnAndRow(column.id, row.id);
    
    const onDragOver = (e) => {
      e.preventDefault();
      dragAndDrop.handleDragOver(e);
    };
    
    const onDrop = (e) => {
      e.preventDefault();
      dragAndDrop.handleDrop(e, column.id, row.id);
    };
    
    return (
      <td 
        key={`${row.id}-${column.id}`} 
        className="grid-cell"
        data-column-id={column.id}
        data-row-id={row.id}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {cellTasks.map(task => (
          <Task 
            key={task.id} 
            task={task}
            columnId={column.id}
            rowId={row.id}  // Make sure rowId is passed here
          />
        ))}
      </td>
    );
  };

  // Otherwise, render the grid-based board with rows and columns
  return (
    <div className="board-grid">
      <table className="kanban-table">
        <thead>
          <tr>
            {/* Top-left empty cell */}
            <th className="grid-corner"></th>
            
            {/* Column headers */}
            {columns.map(column => renderColumnHeader(column))}
          </tr>
        </thead>
        <tbody>
          
          {/* Rows with headers and cells */}
          {enhancedRows.map(row => (
            <tr key={row.id}>
              {/* Row header */}
              {renderRowHeader(row)}
              
              {/* Row cells */}
              {columns.map(column => renderCell(column, row))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Board;