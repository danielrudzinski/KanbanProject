import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Row from '../../components/Row';
import KanbanContext from '../../context/KanbanContext';
import { toast } from 'react-toastify';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

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

describe('Row Component', () => {
  const mockDeleteRow = jest.fn();
  const mockUpdateRowName = jest.fn();
  const mockHandleDragStart = jest.fn();
  const mockHandleDragOver = jest.fn();
  const mockHandleDrop = jest.fn();
  
  const mockRow = {
    id: 'row1',
    name: 'Features',
    position: 0,
    wipLimit: 3,
    taskCount: 2
  };
  
  const mockChildren = <div data-testid="mock-children">Mock Children</div>;
  
  const mockContextValue = {
    deleteRow: mockDeleteRow,
    updateRowName: mockUpdateRowName,
    rows: [mockRow, { id: 'row2', name: 'Another Row' }],
    dragAndDrop: {
      handleDragStart: mockHandleDragStart,
      handleDragOver: mockHandleDragOver,
      handleDrop: mockHandleDrop,
      handleDragEnd: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders row with correct structure', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    expect(screen.getByTestId(`editable-row-${mockRow.id}`)).toBeInTheDocument();
    expect(screen.getByText('☰')).toBeInTheDocument();
    expect(screen.getByTitle('row.delete')).toBeInTheDocument();
    expect(screen.getByText(mockRow.taskCount.toString())).toBeInTheDocument();
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
  });

  test('renders WIP limit when row has wipLimit > 0', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const wipLimitElement = screen.getByText(`row.wipLimit: ${mockRow.wipLimit}`);
    expect(wipLimitElement).toBeInTheDocument();
  });
  
  test('does not render WIP limit when row has wipLimit = 0', () => {
    const rowWithNoLimit = { ...mockRow, wipLimit: 0 };
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={rowWithNoLimit}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    expect(screen.queryByText(/row\.wipLimit/)).not.toBeInTheDocument();
  });
  
  test('shows exceeded WIP limit warning when tasks exceed limit', () => {
    const rowExceedingLimit = { ...mockRow, taskCount: 5, wipLimit: 3 };
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={rowExceedingLimit}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const wipLimitElement = screen.getByText((content) => content.startsWith(`row.wipLimit: ${rowExceedingLimit.wipLimit}`)).closest('.wip-limit');
    expect(wipLimitElement).toHaveClass('exceeded');
    expect(screen.getByText((content) => content.includes('row.wipExceeded'))).toBeInTheDocument();
  }); 
  
  test('handles row drag start correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const rowElement = screen.getByTestId(`editable-row-${mockRow.id}`).closest('.row');
    expect(rowElement).toHaveAttribute('draggable', 'true');
    
    const dragEvent = {
      dataTransfer: { 
        setData: jest.fn(),
        effectAllowed: null
      },
      preventDefault: jest.fn()
    };
    fireEvent.dragStart(rowElement, dragEvent);
    expect(mockHandleDragStart).toHaveBeenCalledWith(
      expect.anything(),
      mockRow.id,
      'row'
    );
  });
  
  test('handles drag over correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const rowElement = screen.getByTestId(`editable-row-${mockRow.id}`).closest('.row');
    const dragOverEvent = {
      preventDefault: jest.fn(),
      dataTransfer: { types: ['application/row'] }
    };
    
    fireEvent.dragOver(rowElement, dragOverEvent);
    
    expect(mockHandleDragOver).toHaveBeenCalled();
    expect(rowElement).toHaveClass('drag-over');
  });
  
  test('handles drag leave correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const rowElement = screen.getByTestId(`editable-row-${mockRow.id}`).closest('.row');
    
    const dragLeaveEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    
    const mockClassList = {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(true)
    };
    
    Object.defineProperty(rowElement, 'classList', {
      value: mockClassList,
      writable: false
    });
    
    fireEvent.dragLeave(rowElement, dragLeaveEvent);
    
    expect(mockClassList.remove).toHaveBeenCalledWith('drag-over');
  });
   
  test('calls updateRowName when row name is edited', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const rowName = screen.getByTestId(`editable-row-${mockRow.id}`);
    fireEvent.click(rowName);
    
    expect(mockUpdateRowName).toHaveBeenCalledWith(
      mockRow.id, 
      `Updated ${mockRow.name}`
    );
  });
  
  test('calls deleteRow when delete button is clicked', () => {
    const mockContextWithRows = {
      ...mockContextValue,
      rows: [mockRow, { id: 'row2', name: 'Another Row' }]
    };
    
    render(
      <KanbanContext.Provider value={mockContextWithRows}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('row.delete');
    fireEvent.click(deleteButton);
    
    const confirmButton = screen.getByText('taskActions.yes');
    fireEvent.click(confirmButton);
    
    expect(mockDeleteRow).toHaveBeenCalledWith(mockRow.id);
  });
  
  test('does not call deleteRow when confirmation is canceled', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('row.delete');
    fireEvent.click(deleteButton);
    const cancelButton = screen.getByText('taskActions.no');
    fireEvent.click(cancelButton);
    
    expect(mockDeleteRow).not.toHaveBeenCalled();
  });
  
  test('handles drop event correctly', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const rowElement = screen.getByTestId(`editable-row-${mockRow.id}`).closest('.row');
    const dropEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: { 
        getData: jest.fn().mockImplementation((type) => {
          if (type === 'application/row') {
            return JSON.stringify({ id: 'row2', type: 'row' });
          }
          return '';
        }),
        types: ['application/row'],
        clearData: jest.fn()
      }
    };
    
    fireEvent.drop(rowElement, dropEvent);
    
    expect(mockHandleDrop).toHaveBeenCalledWith(
      expect.anything(),
      null,
      mockRow.id
    );
  });

  test('shows toast warning when trying to delete the last row', () => {
    const singleRowContext = {
      ...mockContextValue,
      rows: [mockRow]
    };
    
    render(
      <KanbanContext.Provider value={singleRowContext}>
        <Row row={mockRow}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const deleteButton = screen.getByTitle('row.delete');
    fireEvent.click(deleteButton);
    
    expect(toast.warning).toHaveBeenCalledWith('row.lastRowWarning');
    expect(screen.queryByText('row.deleteConfirm')).not.toBeInTheDocument();
    expect(mockDeleteRow).not.toHaveBeenCalled();
  });

  test('does not show exceeded WIP limit warning when tasks do not exceed limit', () => {
    const rowWithinLimit = { 
      ...mockRow, 
      taskCount: 2,
      wipLimit: 3 
    };
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={rowWithinLimit}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const wipLimitElement = screen.getByText(`row.wipLimit: ${rowWithinLimit.wipLimit}`);
    expect(wipLimitElement).not.toHaveClass('exceeded');
    expect(screen.queryByText('row.wipExceeded')).not.toBeInTheDocument();
  });

  test('handles the edge case where taskCount equals wipLimit', () => {
    const rowAtLimit = { 
      ...mockRow, 
      taskCount: 3,
      wipLimit: 3 
    };
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={rowAtLimit}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    const wipLimitElement = screen.getByText(`row.wipLimit: ${rowAtLimit.wipLimit}`);
    expect(wipLimitElement).not.toHaveClass('exceeded');
    expect(screen.queryByText('row.wipExceeded')).not.toBeInTheDocument();
  });

  test('renders task count as 0 when taskCount is undefined', () => {
    const rowWithoutTaskCount = { ...mockRow };
    delete rowWithoutTaskCount.taskCount;
    
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Row row={rowWithoutTaskCount}>{mockChildren}</Row>
      </KanbanContext.Provider>
    );
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});