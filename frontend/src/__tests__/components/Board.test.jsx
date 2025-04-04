/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KanbanContext from '../../context/KanbanContext';
import Board from '../../components/Board';

// Mock the Task component to simplify testing
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

// Mock EditableText component
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
    
    // Check for table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Check for all columns
    mockColumns.forEach(column => {
      expect(screen.getByTestId(`editable-column-${column.id}`)).toBeInTheDocument();
    });
    
    // Check for all rows
    mockRows.forEach(row => {
      expect(screen.getByTestId(`editable-row-${row.id}`)).toBeInTheDocument();
    });
    
    // Check for all tasks
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
    
    // Check for column WIP limits
    const inProgressColumn = mockColumns[1]; // The one with a WIP limit
    const inProgressWipText = screen.getByText(`(${1}/${inProgressColumn.wipLimit})`);
    expect(inProgressWipText).toBeInTheDocument();
    
    // Column without WIP limit shouldn't show specific limit text
    const doneColumn = mockColumns[2]; // The one without a WIP limit
    expect(screen.queryByText(`(${1}/${doneColumn.wipLimit})`)).not.toBeInTheDocument();
  });
  
  test('handles column drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    // Get column header
    const columnHeader = screen.getByTestId(`editable-column-col1`).closest('th');
    
    // Create mock event
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
      }
    };
    
    // Trigger drag start
    fireEvent.dragStart(columnHeader, dragEvent);
    
    // Check that handleDragStart was called with correct arguments
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
    
    // Get row header
    const rowHeader = screen.getByTestId(`editable-row-row1`).closest('td');
    
    // Create mock event
    const dragEvent = {
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: null
      }
    };
    
    // Trigger drag start
    fireEvent.dragStart(rowHeader, dragEvent);
    
    // Check that handleDragStart was called with correct arguments
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
    
    // Find a cell (e.g., col2, row2)
    const cells = document.querySelectorAll('.grid-cell');
    const targetCell = Array.from(cells).find(
      cell => 
        cell.getAttribute('data-column-id') === 'col2' && 
        cell.getAttribute('data-row-id') === 'row2'
    );
    
    // Create mock drop event
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
    
    // Trigger drop
    fireEvent.drop(targetCell, dropEvent);
    
    // Check that handleDrop was called with correct arguments
    expect(mockDragAndDrop.handleDrop).toHaveBeenCalledWith(
      expect.anything(),
      'col2',
      'row2'
    );
  });
  
  test('shows delete confirmation dialog when deleting a column', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    // Find a delete column button
    const deleteButtons = screen.getAllByTitle('Usuń kolumnę');
    
    // Click on the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalledWith(
      'Czy na pewno chcesz usunąć tę kolumnę?'
    );
    
    // Check that deleteColumn was called
    expect(mockContextValue.deleteColumn).toHaveBeenCalledWith('col1');
    
    // Restore original confirm
    window.confirm = originalConfirm;
  });
  
  test('shows alert when trying to delete the last row', () => {
    // Create a context with only one row
    const singleRowContext = {
      ...mockContextValue,
      rows: [mockRows[0]]
    };
    
    // Mock window.alert
    const originalAlert = window.alert;
    window.alert = jest.fn();
    
    // Mock the Task component to simplify testing
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
  });

    // Mock EditableText component
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
    });

        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        test('renders the board with correct structure', () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Check for table structure
            expect(screen.getByRole('table')).toBeInTheDocument();
            
            // Check for all columns
            mockColumns.forEach(column => {
                expect(screen.getByTestId(`editable-column-${column.id}`)).toBeInTheDocument();
            });
            
            // Check for all rows
            mockRows.forEach(row => {
                expect(screen.getByTestId(`editable-row-${row.id}`)).toBeInTheDocument();
            });
            
            // Check for all tasks
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
            
            // Check for column WIP limits
            const inProgressColumn = mockColumns[1]; // The one with a WIP limit
            const inProgressWipText = screen.getByText(`(${1}/${inProgressColumn.wipLimit})`);
            expect(inProgressWipText).toBeInTheDocument();
            
            // Column without WIP limit shouldn't show specific limit text
            const doneColumn = mockColumns[2]; // The one without a WIP limit
            expect(screen.queryByText(`(${1}/${doneColumn.wipLimit})`)).not.toBeInTheDocument();
        });
        
        test('handles column drag start correctly', () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Get column header
            const columnHeader = screen.getByTestId(`editable-column-col1`).closest('th');
            
            // Create mock event
            const dragEvent = {
                dataTransfer: {
                    setData: jest.fn(),
                    effectAllowed: null
                }
            };
            
            // Trigger drag start
            fireEvent.dragStart(columnHeader, dragEvent);
            
            // Check that handleDragStart was called with correct arguments
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
            
            // Get row header
            const rowHeader = screen.getByTestId(`editable-row-row1`).closest('td');
            
            // Create mock event
            const dragEvent = {
                dataTransfer: {
                    setData: jest.fn(),
                    effectAllowed: null
                }
            };
            
            // Trigger drag start
            fireEvent.dragStart(rowHeader, dragEvent);
            
            // Check that handleDragStart was called with correct arguments
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
            
            // Find a cell (e.g., col2, row2)
            const cells = document.querySelectorAll('.grid-cell');
            const targetCell = Array.from(cells).find(
                cell => 
                    cell.getAttribute('data-column-id') === 'col2' && 
                    cell.getAttribute('data-row-id') === 'row2'
            );
            
            // Create mock drop event
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
            
            // Trigger drop
            fireEvent.drop(targetCell, dropEvent);
            
            // Check that handleDrop was called with correct arguments
            expect(mockDragAndDrop.handleDrop).toHaveBeenCalledWith(
                expect.anything(),
                'col2',
                'row2'
            );
        });
        
        test('shows delete confirmation dialog when deleting a column', () => {
            // Mock window.confirm
            const originalConfirm = window.confirm;
            window.confirm = jest.fn().mockReturnValue(true);
            
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Find a delete column button
            const deleteButtons = screen.getAllByTitle('Usuń kolumnę');
            
            // Click on the first delete button
            fireEvent.click(deleteButtons[0]);
            
            // Check that confirm was called
            expect(window.confirm).toHaveBeenCalledWith(
                'Czy na pewno chcesz usunąć tę kolumnę?'
            );
            
            // Check that deleteColumn was called
            expect(mockContextValue.deleteColumn).toHaveBeenCalledWith('col1');
            
            // Restore original confirm
            window.confirm = originalConfirm;
        });
        
        test('shows alert when trying to delete the last row', () => {
            // Create a context with only one row
            const singleRowContext = {
                ...mockContextValue,
                rows: [mockRows[0]]
            };
            
            // Mock window.alert
            const originalAlert = window.alert;
            window.alert = jest.fn();
            
            render(
                <KanbanContext.Provider value={singleRowContext}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Find a delete row button
            const deleteButton = screen.getByTitle('Usuń wiersz');
            
            // Click on the delete button
            fireEvent.click(deleteButton);
            
            // Check that alert was called
            expect(window.alert).toHaveBeenCalledWith(
                'Nie można usunąć ostatniego wiersza.'
            );
            
            // Check that deleteRow was not called
            expect(mockContextValue.deleteRow).not.toHaveBeenCalled();
            
            // Restore original alert
            window.alert = originalAlert;
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

  // Test for checking task counts display
  test('displays correct task counts for columns and rows', () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Check task count for "To Do" column (2 tasks)
            const toDoColumnHeader = screen.getByTestId('editable-column-col1').closest('th');
            expect(toDoColumnHeader.querySelector('.task-count')).toHaveTextContent('2');
            
            // Check task count for "Features" row (2 tasks)
            const featuresRowHeader = screen.getByTestId('editable-row-row1').closest('td');
            expect(featuresRowHeader.querySelector('.task-count')).toHaveTextContent('2');
        });
        
  // Test for WIP limit exceeded highlighting
  test('highlights rows when WIP limit is exceeded', () => {
            // Create a context with exceeded WIP limit
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
            
            // The Features row (row1) has a WIP limit of 2, but now has 4 tasks
            const featuresRowHeader = screen.getByTestId('editable-row-row1').closest('td');
            expect(featuresRowHeader).toHaveClass('wip-exceeded');
            
            // Check that the WIP limit indicator shows the exceeded values
            const rowWipLimit = featuresRowHeader.querySelector('.wip-limit');
            expect(rowWipLimit).toHaveClass('exceeded');
            expect(rowWipLimit).toHaveTextContent('(4/2)');
        });
        
  // Test for proper cell drag over handling
  test('handles dragOver on board correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    const boardElement = document.querySelector('.board-grid');
    
    // Create mock dragOver event with properly mocked dataTransfer
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/column']
      }
    };
    
    // Trigger dragOver
    fireEvent.dragOver(boardElement, dragOverEvent);
    
    // Check that handleDragOver was called, but don't expect preventDefault
    // since it's conditionally called inside the onBoardDragOver handler
    expect(mockDragAndDrop.handleDragOver).toHaveBeenCalled();
  });
  
  test('handles dragOver on cells correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    // Find a cell
    const cells = document.querySelectorAll('.grid-cell');
    const targetCell = cells[0];
    
    // Create mock dragOver event with task type that will trigger preventDefault
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/task'] // Add a type that will trigger prevention
      }
    };
    
    // Trigger dragOver
    fireEvent.dragOver(targetCell, dragOverEvent);
    
    // Check that handleDragOver was called
    expect(mockDragAndDrop.handleDragOver).toHaveBeenCalled();
  });
        
  // Test CSS variable setting for column count
  test('sets CSS variable for column count', () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Board />
                </KanbanContext.Provider>
            );
            
            // Check if the CSS variable has been set
            expect(document.documentElement.style.getPropertyValue('--column-count')).toBe('3');
        });
        
  // Test row deletion confirmation dialog
  test('shows delete confirmation dialog when deleting a row', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    // Find delete row button more specifically
    const rowHeader = screen.getByTestId('editable-row-row1').closest('td');
    const deleteButton = rowHeader.querySelector('.delete-row-btn');
    
    // Click on the delete button
    fireEvent.click(deleteButton);
    
    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalledWith(
      'Czy na pewno chcesz usunąć ten wiersz?'
    );
    
    // Check that deleteRow was called
    expect(mockContextValue.deleteRow).toHaveBeenCalledWith('row1');
    
    // Restore original confirm
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
  
  // Test for handling dragOver on different elements
  test('calls handleDragOver when dragging over elements', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Board />
      </KanbanContext.Provider>
    );
    
    // Target the board-grid element instead of the table
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