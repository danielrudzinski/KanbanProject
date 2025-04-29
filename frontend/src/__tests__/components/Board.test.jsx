import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KanbanContext from '../../context/KanbanContext';
import Board from '../../components/Board';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../../components/Task', () => {
  return function MockTask({ task, columnId }) {
    return (
      <div 
        data-testid={`task-${task.id}`} 
        className="task"
        data-column-id={columnId}
        data-row-id={task.rowId}
      >
        {task.title}
      </div>
    );
  };
});

jest.mock('../../components/EditableText', () => {
  return function MockEditableText({ id, text, type }) {
    return (
      <div 
        data-testid={`editable-${type}-${id}`} 
        className="editable-text"
      >
        {text}
      </div>
    );
  };
});

describe('Board Component', () => {
  const mockColumns = [
    { id: 'col1', name: 'To Do', position: 0, wipLimit: 3 },
    { id: 'col2', name: 'In Progress', position: 1, wipLimit: 2 },
    { id: 'col3', name: 'Done', position: 2, wipLimit: 0 }
  ];
  
  const mockRows = [
    { id: 'row1', name: 'Features', position: 0, wipLimit: 2 },
    { id: 'row2', name: 'Bugs', position: 1, wipLimit: 3 }
  ];
  
  const mockTasks = [
    { id: '1', title: 'Task 1', columnId: 'col1', rowId: 'row1' },
    { id: '2', title: 'Task 2', columnId: 'col1', rowId: 'row2' },
    { id: '3', title: 'Task 3', columnId: 'col2', rowId: 'row1' },
    { id: '4', title: 'Task 4', columnId: 'col3', rowId: 'row2' }
  ];
  
  const mockDragAndDrop = {
    draggedItem: null,
    handleDragStart: jest.fn(),
    handleDragOver: jest.fn(),
    handleDrop: jest.fn(),
    handleDragEnd: jest.fn(),
    handleTaskReorder: jest.fn()
  };
  
  const mockContextValue = {
    columns: mockColumns,
    rows: mockRows,
    tasks: mockTasks,
    loading: false,
    error: null,
    deleteRow: jest.fn(),
    deleteColumn: jest.fn(),
    updateColumnName: jest.fn(),
    updateRowName: jest.fn(),
    dragAndDrop: mockDragAndDrop
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders the board with correct structure', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    mockColumns.forEach(column => {
      expect(screen.getByTestId(`editable-column-${column.id}`)).toBeInTheDocument();
    });
    mockRows.forEach(row => {
      expect(screen.getByTestId(`editable-row-${row.id}`)).toBeInTheDocument();
    });
    mockTasks.forEach(task => {
      expect(screen.getByTestId(`task-${task.id}`)).toBeInTheDocument();
    });
  });
  
  test('shows WIP limits correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    const inProgressColumn = mockColumns[1]; 
    const inProgressWipText = screen.getByText(`(${1}/${inProgressColumn.wipLimit})`);
    expect(inProgressWipText).toBeInTheDocument();
    const doneColumn = mockColumns[2];
    expect(screen.queryByText(`(${1}/${doneColumn.wipLimit})`)).not.toBeInTheDocument();
  });
  
  test('handles column drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const columnHeader = screen.getByTestId(`editable-column-col1`).closest('th');
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
      }
    };
    
    fireEvent.dragStart(columnHeader, dragEvent);
    expect(mockDragAndDrop.handleDragStart).toHaveBeenCalledWith(
      expect.anything(),
      'col1',
      'column'
    );
  });
  
  test('handles row drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const rowHeader = screen.getByTestId(`editable-row-row1`).closest('td');
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
      }
    };
    
    fireEvent.dragStart(rowHeader, dragEvent);
    expect(mockDragAndDrop.handleDragStart).toHaveBeenCalledWith(
      expect.anything(),
      'row1',
      'row'
    );
  });
  
  test('handles cell drop correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const cells = document.querySelectorAll('.grid-cell');
    const targetCell = Array.from(cells).find(
      cell => 
        cell.getAttribute('data-column-id') === 'col2' && 
        cell.getAttribute('data-row-id') === 'row2'
    );
    
    const dropEvent = {
      dataTransfer: {
        getData: jest.fn().mockImplementation(type => {
          if (type === 'application/task') {
            return JSON.stringify({ id: '1', type: 'task' });
          }
          return '';
        }),
        types: ['application/task'],
        clearData: jest.fn()
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    };
    
    fireEvent.drop(targetCell, dropEvent);
    expect(mockDragAndDrop.handleDrop).toHaveBeenCalledWith(
      expect.anything(),
      'col2',
      'row2'
    );
  });
  
  test('shows delete confirmation dialog when deleting a column', () => {
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );

    const deleteButtons = screen.getAllByTitle('Usuń kolumnę');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Czy na pewno chcesz usunąć tę kolumnę?'
    );
    
    expect(mockContextValue.deleteColumn).toHaveBeenCalledWith('col1');
    window.confirm = originalConfirm;
  });
        
  test('shows WIP limits correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const inProgressColumn = mockColumns[1]; 
    const inProgressWipText = screen.getByText(`(${1}/${inProgressColumn.wipLimit})`);
    expect(inProgressWipText).toBeInTheDocument();
            
    const doneColumn = mockColumns[2]; 
    expect(screen.queryByText(`(${1}/${doneColumn.wipLimit})`)).not.toBeInTheDocument();
  });
        
  test('handles column drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const columnHeader = screen.getByTestId(`editable-column-col1`).closest('th');
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
       }
    };
            
    fireEvent.dragStart(columnHeader, dragEvent);
    expect(mockDragAndDrop.handleDragStart).toHaveBeenCalledWith(
       expect.anything(),
         'col1',
         'column'
      );
  });
        
  test('handles row drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const rowHeader = screen.getByTestId(`editable-row-row1`).closest('td');
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
      }
   };
            
    fireEvent.dragStart(rowHeader, dragEvent);

    expect(mockDragAndDrop.handleDragStart).toHaveBeenCalledWith(
      expect.anything(),
        'row1',
        'row'
      );
  });
        
  test('shows toast error when trying to delete the last row', () => {
    const singleRowContext = {
      ...mockContextValue,
      rows: [mockRows[0]]
    };
            
    render(
      <KanbanContext.Provider value={singleRowContext}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const deleteButton = screen.getByTitle('Usuń wiersz');
    fireEvent.click(deleteButton);
    
    expect(toast.error).toHaveBeenCalledWith('Nie można usunąć ostatniego wiersza.');
    expect(mockContextValue.deleteRow).not.toHaveBeenCalled();
  });
        
  test('shows loading state correctly', () => {
    const loadingContext = {
      ...mockContextValue,
      loading: true
    };
            
    render(
      <KanbanContext.Provider value={loadingContext}>
        <Board />
      </KanbanContext.Provider>
    );
            
    expect(screen.getByText('Loading kanban board...')).toBeInTheDocument();
  });
        
  test('shows error state correctly', () => {
    const errorContext = {
      ...mockContextValue,
      error: 'Failed to load board data'
    };
            
    render(
      <KanbanContext.Provider value={errorContext}>
        <Board />
      </KanbanContext.Provider>
    );
            
    expect(screen.getByText('Error: Failed to load board data')).toBeInTheDocument();
  });

  test('displays correct task counts for columns and rows', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const toDoColumnHeader = screen.getByTestId('editable-column-col1').closest('th');
    expect(toDoColumnHeader.querySelector('.task-count')).toHaveTextContent('2');
    const featuresRowHeader = screen.getByTestId('editable-row-row1').closest('td');
    expect(featuresRowHeader.querySelector('.task-count')).toHaveTextContent('2');
  });
        
  test('highlights rows when WIP limit is exceeded', () => {

    const tasksExceedingWipLimit = [...mockTasks, 
      { id: '5', title: 'Task 5', columnId: 'col2', rowId: 'row1' },
      { id: '6', title: 'Task 6', columnId: 'col3', rowId: 'row1' }
    ];
            
    const wipExceededContext = {
      ...mockContextValue,
      tasks: tasksExceedingWipLimit
    };
            
    render(
      <KanbanContext.Provider value={wipExceededContext}>
        <Board />
      </KanbanContext.Provider>
    );
            
    const featuresRowHeader = screen.getByTestId('editable-row-row1').closest('td');
    expect(featuresRowHeader).toHaveClass('wip-exceeded');
            
    const rowWipLimit = featuresRowHeader.querySelector('.wip-limit');
    expect(rowWipLimit).toHaveClass('exceeded');
    expect(rowWipLimit).toHaveTextContent('(4/2)');
  });
        
  test('handles dragOver on board correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const boardElement = document.querySelector('.board-grid');
    
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/column']
      }
    };
    
    fireEvent.dragOver(boardElement, dragOverEvent);
    expect(mockDragAndDrop.handleDragOver).toHaveBeenCalled();
  });
  
  test('handles dragOver on cells correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const cells = document.querySelectorAll('.grid-cell');
    const targetCell = cells[0];
    
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/task']
      }
    };
    
    fireEvent.dragOver(targetCell, dragOverEvent);
    expect(mockDragAndDrop.handleDragOver).toHaveBeenCalled();
  });
        
  test('sets CSS variable for column count', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
            
    expect(document.documentElement.style.getPropertyValue('--column-count')).toBe('3');
  });
        
  test('shows delete confirmation dialog when deleting a row', () => {
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const rowHeader = screen.getByTestId('editable-row-row1').closest('td');
    const deleteButton = rowHeader.querySelector('.delete-row-btn');
    
    fireEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith(
      'Czy na pewno chcesz usunąć ten wiersz?'
    );
    
    expect(mockContextValue.deleteRow).toHaveBeenCalledWith('row1');
    window.confirm = originalConfirm;
  });
  
  test('shows error state correctly', () => {
    const errorContext = {
      ...mockContextValue,
      error: 'Failed to load board data'
    };
    
    render(
      <KanbanContext.Provider value={errorContext}>
        <Board />
      </KanbanContext.Provider>
    );
    
    expect(screen.getByText('Error: Failed to load board data')).toBeInTheDocument();
  });

  test('properly renders columns with their WIP limits', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    mockColumns.forEach((column, index) => {
      const columnElement = screen.getByTestId(`editable-column-${column.id}`);
      expect(columnElement).toBeInTheDocument();
      
      if (column.wipLimit > 0) {
        const columnHeader = columnElement.closest('th');
        const wipText = columnHeader.querySelector('.wip-limit');
        expect(wipText).toBeInTheDocument();
      }
    });
  });
  
  test('properly renders rows with their WIP limits', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    mockRows.forEach(row => {
      const rowElement = screen.getByTestId(`editable-row-${row.id}`);
      expect(rowElement).toBeInTheDocument();
      
      if (row.wipLimit > 0) {
        const rowHeader = rowElement.closest('td');
        const wipText = rowHeader.querySelector('.wip-limit');
        expect(wipText).toBeInTheDocument();
      }
    });
  });
  
  test('calls handleDragOver when dragging over elements', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const boardGrid = document.querySelector('.board-grid');
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/task']
      }
    };
    
    fireEvent.dragOver(boardGrid, dragOverEvent);
    
    expect(mockDragAndDrop.handleDragOver).toHaveBeenCalled();
  });

});