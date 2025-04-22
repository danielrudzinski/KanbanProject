import { useKanban } from '../context/KanbanContext';
import React, { useEffect } from 'react';
import Task from './Task';
import EditableText from './EditableText';
import { toast } from 'react-toastify';
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
  } = useKanban();
  
  const { handleDragOver } = dragAndDrop;

  useEffect(() => {
    if (columns.length > 0) {
      document.documentElement.style.setProperty('--column-count', columns.length);
    }
    
    return () => {
      document.documentElement.style.setProperty('--column-count', 3);
    };
  }, [columns.length, rows.length]);

  if (loading) {
    return <div className="board-loading">Loading kanban board...</div>;
  }

  if (error) {
    return <div className="board-error">Error: {error}</div>;
  }

  const getTasksByColumnAndRow = (columnId, rowId = null) => {
    return tasks.filter(task => 
      task.columnId === columnId && task.rowId === rowId
    );
  };

  const calculateTaskCounts = () => {
    const counts = {};
    rows.forEach(row => {
      counts[row.id] = tasks.filter(task => task.rowId === row.id).length;
    });
    return counts;
  };

  const taskCounts = calculateTaskCounts();

  const calculateColumnTaskCounts = () => {
    const counts = {};
    columns.forEach(column => {
      counts[column.id] = tasks.filter(task => task.columnId === column.id).length;
    });
    return counts;
  };

  const columnTaskCounts = calculateColumnTaskCounts();

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

  const checkColumnWipLimits = () => {
    const columnStatus = {};
    columns.forEach(column => {
      if (column.wipLimit > 0) {
        const columnTaskCount = columnTaskCounts[column.id] || 0;
        columnStatus[column.id] = columnTaskCount > column.wipLimit;
      }
    });
    return columnStatus;
  };

  const rowWipStatus = checkRowWipLimits();
  const columnWipStatus = checkColumnWipLimits();

  const enhancedRows = rows.map(row => ({
    ...row,
    taskCount: taskCounts[row.id] || 0,
    isOverLimit: rowWipStatus[row.id] || false
  }));

  const enhancedColumns = columns.map(column => ({
    ...column,
    taskCount: columnTaskCounts[column.id] || 0,
    isOverLimit: columnWipStatus[column.id] || false
  }));

  const onBoardDragOver = (e) => {
    handleDragOver(e);
    
    if (e.dataTransfer.types.includes('application/column')) {
      e.preventDefault();
    }
  };

  const safeDeleteRow = (rowId) => {
    if (rows.length > 1) {
      if (window.confirm('Czy na pewno chcesz usunąć ten wiersz?')) {
        deleteRow(rowId);
      }
    } else {
      toast.error('Nie można usunąć ostatniego wiersza.');
    }
  };

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
        className={`grid-row-header ${row.isOverLimit ? 'wip-exceeded' : ''}`}
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

  const renderColumnHeader = (column) => {
    const columnTaskCount = columnTaskCounts[column.id] || 0;
    const isOverLimit = column.wipLimit > 0 && columnTaskCount > column.wipLimit;
    
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
        className={`grid-column-header ${isOverLimit ? 'wip-exceeded' : ''}`}
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

  const renderCell = (column, row) => {
    const cellTasks = getTasksByColumnAndRow(column.id, row.id);
    const hasTasksInCell = cellTasks.length > 0;
    
    const columnExceedsWip = column.wipLimit > 0 && columnTaskCounts[column.id] > column.wipLimit;
    const rowExceedsWip = row.wipLimit > 0 && taskCounts[row.id] > row.wipLimit;
    const shouldHighlight = hasTasksInCell && (columnExceedsWip || rowExceedsWip);
    
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
        className={`grid-cell ${shouldHighlight ? 'wip-exceeded-cell' : ''}`}
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

  return (
    <div className="board-grid" onDragOver={onBoardDragOver}>
      <table className="kanban-table">
        <thead>
          <tr>
            {/* Top-left empty cell */}
            <th className="grid-corner"></th>
            
            {/* Column headers */}
            {enhancedColumns.map(column => renderColumnHeader(column))}
          </tr>
        </thead>
        <tbody>
          {/* Rows with headers and cells */}
          {enhancedRows.map(row => (
            <tr key={row.id}>
              {/* Row header */}
              {renderRowHeader(row)}
              
              {/* Row cells */}
              {enhancedColumns.map(column => renderCell(column, row))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Board;