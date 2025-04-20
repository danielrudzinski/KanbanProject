import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Column from '../../components/Column';
import KanbanContext from '../../context/KanbanContext';

jest.mock('../../components/Task', () => {
  return function MockTask({ task }) {
    return <div data-testid={`task-${task.id}`} className="task">{task.title}</div>;
  };
});

jest.mock('../../components/EditableText', () => {
  return function MockEditableText({ id, text, onUpdate, type, className }) {
    return (
      <div 
        data-testid={`editable-${type}-${id}`} 
        className={`editable-text ${className || ''}`}
        onClick={() => onUpdate(id, `Updated ${text}`)}
      >
        {text}
      </div>
    );
  };
});

describe('Column Component', () => {
  const mockDeleteColumn = jest.fn();
  const mockUpdateColumnName = jest.fn();
  const mockHandleDragStart = jest.fn();
  const mockHandleDragOver = jest.fn();
  const mockHandleDrop = jest.fn();
  
  const mockColumn = {
    id: 'col1',
    name: 'To Do',
    position: 0,
    wipLimit: 3
  };
  
  const mockTasks = [
    { id: 'task1', title: 'Task 1', columnId: 'col1', rowId: 'row1' },
    { id: 'task2', title: 'Task 2', columnId: 'col1', rowId: 'row2' }
  ];
  
  const mockContextValue = {
    deleteColumn: mockDeleteColumn,
    updateColumnName: mockUpdateColumnName,
    dragAndDrop: {
      handleDragStart: mockHandleDragStart,
      handleDragOver: mockHandleDragOver,
      handleDrop: mockHandleDrop,
      handleDragEnd: jest.fn(),
      handleTaskReorder: jest.fn()
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders column with correct structure', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    expect(screen.getByTestId(`editable-column-${mockColumn.id}`)).toBeInTheDocument();
    expect(screen.getByText('☰')).toBeInTheDocument();
    expect(screen.getByText(mockTasks.length.toString())).toBeInTheDocument();
    expect(screen.getByTitle('Usuń kolumnę')).toBeInTheDocument();
    
    mockTasks.forEach(task => {
      expect(screen.getByTestId(`task-${task.id}`)).toBeInTheDocument();
    });
  });
  
  test('renders WIP limit when column has wipLimit > 0', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    expect(screen.getByText(`Limit: ${mockColumn.wipLimit}`)).toBeInTheDocument();
  });
  
  test('does not render WIP limit when column has wipLimit = 0', () => {
    const columnWithNoLimit = { ...mockColumn, wipLimit: 0 };
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={columnWithNoLimit} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    expect(screen.queryByText(/Limit:/)).not.toBeInTheDocument();
  });
  
  test('shows exceeded WIP limit warning when tasks exceed limit', () => {
    const exceededTasks = [
      ...mockTasks,
      { id: 'task3', title: 'Task 3', columnId: 'col1', rowId: 'row1' },
      { id: 'task4', title: 'Task 4', columnId: 'col1', rowId: 'row2' }
    ];
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={exceededTasks} />
      </KanbanContext.Provider>
    );
    
    const wipLimit = screen.getByText(/Limit:/, { exact: false });
    expect(wipLimit).toHaveClass('exceeded');
    expect(screen.getByText('(przekroczony!)', { exact: false })).toBeInTheDocument();
  });
  
  test('shows delete confirmation when delete button is clicked', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('Usuń kolumnę');
    fireEvent.click(deleteButton);
    
    expect(screen.getByText('Czy na pewno chcesz usunąć tę kolumnę?')).toBeInTheDocument();
    expect(screen.getByText('Tak')).toBeInTheDocument();
    expect(screen.getByText('Nie')).toBeInTheDocument();
  });
  
  test('calls deleteColumn when confirm delete button is clicked', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('Usuń kolumnę');
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByText('Tak');
    fireEvent.click(confirmButton);
    
    expect(mockDeleteColumn).toHaveBeenCalledWith(mockColumn.id);
  });
  
  test('hides delete confirmation when cancel button is clicked', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('Usuń kolumnę');
    fireEvent.click(deleteButton);
    
    const cancelButton = screen.getByText('Nie');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Czy na pewno chcesz usunąć tę kolumnę?')).not.toBeInTheDocument();
    expect(mockDeleteColumn).not.toHaveBeenCalled();
  });
  
  test('handles column drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const columnElement = screen.getByTestId(`editable-column-${mockColumn.id}`).closest('.column');
    expect(columnElement).toHaveAttribute('draggable', 'true');
    
    const dragEvent = {
      dataTransfer: { 
        setData: jest.fn(),
        effectAllowed: null
      },
      preventDefault: jest.fn()
    };
    fireEvent.dragStart(columnElement, dragEvent);
    expect(mockHandleDragStart).toHaveBeenCalledWith(
      expect.anything(),
      mockColumn.id,
      'column'
    );
  });
  
  test('handles drag over correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const columnElement = screen.getByTestId(`editable-column-${mockColumn.id}`).closest('.column');
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: { types: ['application/column'] }
    };
    
    fireEvent.dragOver(columnElement, dragOverEvent);
    
    expect(mockHandleDragOver).toHaveBeenCalled();
    expect(columnElement).toHaveClass('drag-over');
  });
  
  test('handles drag leave correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const columnElement = screen.getByTestId(`editable-column-${mockColumn.id}`).closest('.column');
    
    fireEvent.dragOver(columnElement, {
      preventDefault: jest.fn(),
      dataTransfer: { types: ['application/column'] }
    });
    
    fireEvent.dragLeave(columnElement);
    expect(columnElement).not.toHaveClass('drag-over');
  });
  
  test('calls updateColumnName when column name is edited', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const columnName = screen.getByTestId(`editable-column-${mockColumn.id}`);
    fireEvent.click(columnName);
    
    expect(mockUpdateColumnName).toHaveBeenCalledWith(
      mockColumn.id, 
      `Updated ${mockColumn.name}`
    );
  });

  test('console logs on column drop event', () => {
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Column column={mockColumn} tasks={mockTasks} />
      </KanbanContext.Provider>
    );
    
    const columnElement = screen.getByTestId(`editable-column-${mockColumn.id}`).closest('.column');
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { 
        getData: jest.fn().mockReturnValue(''),
        types: ['application/column'],
        clearData: jest.fn()
      }
    };
    
    fireEvent.drop(columnElement, dropEvent);
    
    expect(console.log).toHaveBeenCalledWith(
      'Column drop event on column:',
      mockColumn.id
    );
    
    console.log = originalConsoleLog;
  });
});