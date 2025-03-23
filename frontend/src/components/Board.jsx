import { useKanban } from '../context/KanbanContext';
import { useEffect } from 'react';
import Task from './Task';
import EditableText from './EditableText';
import '../styles/components/Board.css';

function Board() {
  const { 
    columns, 
    rows, 
    tasks, 
    loading, 
    error, 
    deleteRow, 
    deleteColumn, 
    dragAndDrop,
    updateColumnName,
    updateRowName,
    updateTaskName
  } = useKanban();
  
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

  // Filter tasks by column and row
  const getTasksByColumnAndRow = (columnId, rowId = null) => {
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

  // Safe deleteRow function that prevents deleting the last row
  const safeDeleteRow = (rowId) => {
    if (rows.length > 1) {
      if (window.confirm('Czy na pewno chcesz usunąć ten wiersz?')) {
        deleteRow(rowId);
      }
    } else {
      alert('Nie można usunąć ostatniego wiersza.');
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
          <EditableText 
            id={row.id} 
            text={row.name} 
            onUpdate={updateRowName} 
            className="row-name"
            inputClassName="row-name-input"
            type="row"
          />
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
            onClick={() => safeDeleteRow(row.id)}
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
    
    const columnTaskCount = tasks.filter(t => t.columnId === column.id).length;
    const isOverLimit = column.wipLimit > 0 && columnTaskCount > column.wipLimit;
    
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
          <EditableText 
            id={column.id} 
            text={column.name} 
            onUpdate={updateColumnName} 
            className="column-name"
            inputClassName="column-name-input"
            type="column"
          />
        </div>
        <div className="column-actions">
          <span className="task-count">{columnTaskCount}</span>
          {column.wipLimit > 0 && (
            <span className={`wip-limit ${isOverLimit ? 'exceeded' : ''}`}>
              ({columnTaskCount}/{column.wipLimit})
            </span>
          )}
          <button 
            className="delete-column-btn" 
            title="Usuń kolumnę"
            onClick={() => {
              if (window.confirm('Czy na pewno chcesz usunąć tę kolumnę?')) {
                deleteColumn(column.id);
              }
            }}
          >
            ×
          </button>
        </div>
      </th>
    );
  };

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
            rowId={row.id}
          />
        ))}
      </td>
    );
  };

  // Always render the grid-based board with rows and columns
  return (
    <div className="board-grid" onDragOver={onBoardDragOver}>
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