import React, { useState } from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KanbanContext, { KanbanProvider, useKanban } from '../../context/KanbanContext';
import * as api from '../../services/api';

jest.mock('../../services/api', () => ({
  fetchColumns: jest.fn(),
  fetchTasks: jest.fn(),
  fetchRows: jest.fn(),
  fetchUsers: jest.fn(),
  updateTaskColumn: jest.fn(),
  updateTaskRow: jest.fn(),
  deleteTask: jest.fn(),
  addTask: jest.fn(),
  addColumn: jest.fn(),
  addRow: jest.fn(),
  updateColumnWipLimit: jest.fn(),
  updateRowWipLimit: jest.fn(),
  deleteColumn: jest.fn(),
  deleteRow: jest.fn(),
  updateColumnPosition: jest.fn(),
  updateRowPosition: jest.fn(),
  updateTaskPosition: jest.fn(),
  updateTaskName: jest.fn(),
  updateRowName: jest.fn(),
  updateColumnName: jest.fn(),
  getUserWipLimit: jest.fn(),
  updateUserWipLimit: jest.fn(),
  refreshBoard: jest.fn(),
}));

const TestComponent = () => {
  const context = useKanban();
  
  if (context.loading) return <div>Loading...</div>;
  if (context.error) return <div>Error: {context.error}</div>;
  
  return (
    <div>
      <div>Columns: {context.columns.map(c => c.name).join(', ')}</div>
      <div>Rows: {context.rows.map(r => r.name).join(', ')}</div>
      <div>Tasks: {context.tasks.map(t => t.title).join(', ')}</div>
      <div>Users: {context.users.map(u => u.name).join(', ')}</div>
      
      <button onClick={() => context.addTask('New Task')}>Add Task</button>
      <button onClick={() => context.addColumn('New Column', 5)}>Add Column</button>
      <button onClick={() => context.addRow('New Row', 3)}>Add Row</button>
      <button onClick={() => context.deleteTask('1')}>Delete Task</button>
      <button onClick={() => context.deleteColumn('col1')}>Delete Column</button>
      <button onClick={() => context.deleteRow('row1')}>Delete Row</button>
      <button onClick={() => context.moveTask('1', 'col2', 'row1')}>Move Task</button>
      <button onClick={() => context.updateTaskName('1', 'Updated Task')}>Update Task Name</button>
      <button onClick={() => context.updateColumnName('col1', 'Updated Column')}>Update Column Name</button>
      <button onClick={() => context.updateRowName('row1', 'Updated Row')}>Update Row Name</button>
      <button onClick={() => context.updateWipLimit('col1', 4)}>Update Column WIP</button>
      <button onClick={() => context.updateRowWipLimit('row1', 5)}>Update Row WIP</button>
      <button onClick={() => context.refreshTasks()}>Refresh Tasks</button>
      <button onClick={() => context.refreshBoard()}>Refresh Board</button>
      <button onClick={() => context.getUserWipLimit(1)}>Get User WIP Limit</button>
      <button onClick={() => context.updateUserWipLimit(1, 10)}>Update User WIP Limit</button>
    </div>
  );
};

const AdvancedTestComponent = ({ dragAndDropTest }) => {
  const { dragAndDrop } = useKanban();
  
  return (
    <div>
      <button 
        data-testid="drag-task"
        onClick={() => {
          const mockEvent = {
            dataTransfer: { setData: jest.fn(), effectAllowed: null },
            preventDefault: jest.fn()
          };
          dragAndDrop.handleDragStart(mockEvent, '1', 'task', 'col1', 'row1');
          dragAndDropTest && dragAndDropTest(mockEvent, dragAndDrop);
        }}
      >Drag Task</button>
      <button 
        data-testid="drag-column"
        onClick={() => {
          const mockEvent = {
            dataTransfer: { setData: jest.fn(), effectAllowed: null },
            preventDefault: jest.fn()
          };
          dragAndDrop.handleDragStart(mockEvent, 'col1', 'column');
          dragAndDropTest && dragAndDropTest(mockEvent, dragAndDrop);
        }}
      >Drag Column</button>
      <button 
        data-testid="drag-row"
        onClick={() => {
          const mockEvent = {
            dataTransfer: { setData: jest.fn(), effectAllowed: null },
            preventDefault: jest.fn()
          };
          dragAndDrop.handleDragStart(mockEvent, 'row1', 'row');
          dragAndDropTest && dragAndDropTest(mockEvent, dragAndDrop);
        }}
      >Drag Row</button>
      <button 
        data-testid="reorder-tasks"
        onClick={() => dragAndDrop.handleTaskReorder('1', '2')}
      >Reorder Tasks</button>
    </div>
  );
};

describe('KanbanContext Provider', () => {
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
    { id: '1', title: 'Task 1', columnId: 'col1', rowId: 'row1', position: 0, labels: ['Bug'] },
    { id: '2', title: 'Task 2', columnId: 'col1', rowId: 'row2', position: 1, labels: ['Feature'] },
    { id: '3', title: 'Task 3', columnId: 'col2', rowId: 'row1', position: 0, labels: ['High Priority'] }
  ];
  
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', wipLimit: 5 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', wipLimit: 3 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    api.fetchColumns.mockImplementation(() => Promise.resolve(mockColumns));
    api.fetchRows.mockImplementation(() => Promise.resolve(mockRows));
    api.fetchTasks.mockImplementation(() => Promise.resolve(mockTasks));
    api.fetchUsers.mockImplementation(() => Promise.resolve(mockUsers));
  });

  test('renders loading state initially', async () => {
    render(
      <KanbanProvider>
        <TestComponent />
      </KanbanProvider>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('loads and displays board data correctly', async () => {
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(api.fetchColumns).toHaveBeenCalled();
      expect(api.fetchRows).toHaveBeenCalled();
      expect(api.fetchTasks).toHaveBeenCalled();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/To Do, In Progress, Done/)).toBeInTheDocument();
    expect(screen.getByText(/Features, Bugs/)).toBeInTheDocument();
    expect(screen.getByText(/Task 1, Task 2, Task 3/)).toBeInTheDocument();
  });

  test('handles data fetching errors', async () => {
    api.fetchColumns.mockRejectedValueOnce(new Error('Failed to fetch columns'));
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch columns')).toBeInTheDocument();
    });
  });

  test('adds a new task successfully', async () => {
    api.addTask.mockResolvedValueOnce({ id: '4', title: 'New Task' });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add Task'));
    });
    
    expect(api.addTask).toHaveBeenCalledWith('New Task', 'col1', null);
    expect(api.fetchTasks).toHaveBeenCalled();
  });

  test('adds a new column successfully', async () => {
    api.addColumn.mockResolvedValueOnce({ id: 'col4', name: 'New Column', wipLimit: 5 });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add Column'));
    });
    
    expect(api.addColumn).toHaveBeenCalledWith('New Column', 5);
    expect(api.fetchColumns).toHaveBeenCalled();
  });

  test('adds a new row successfully', async () => {
    api.addRow.mockResolvedValueOnce({ id: 'row3', name: 'New Row', wipLimit: 3 });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Add Row'));
    });
    
    expect(api.addRow).toHaveBeenCalledWith('New Row', 3);
    expect(api.fetchRows).toHaveBeenCalled();
  });

  test('deletes a task successfully', async () => {
    api.deleteTask.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Delete Task'));
    });
    
    expect(api.deleteTask).toHaveBeenCalledWith('1');
    expect(api.fetchTasks).toHaveBeenCalled();
  });

  test('deletes a column successfully', async () => {
    api.deleteColumn.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Delete Column'));
    });
    
    expect(api.deleteColumn).toHaveBeenCalledWith('col1');
    expect(api.fetchColumns).toHaveBeenCalled();
  });

  test('deletes a row successfully', async () => {
    api.deleteRow.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Delete Row'));
    });
    
    expect(api.deleteRow).toHaveBeenCalledWith('row1');
    expect(api.fetchRows).toHaveBeenCalled();
  });

  test('moves a task successfully', async () => {
    api.updateTaskColumn.mockResolvedValueOnce({ success: true });
    api.updateTaskRow.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Move Task'));
    });

    expect(api.updateTaskColumn).toHaveBeenCalledWith('1', 'col2');
    expect(api.updateTaskRow).not.toHaveBeenCalled();
    jest.clearAllMocks();
  });

  test('updates a task name successfully', async () => {
    api.updateTaskName.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Task Name'));
    });
    
    expect(api.updateTaskName).toHaveBeenCalledWith('1', 'Updated Task');
    expect(api.fetchTasks).toHaveBeenCalled();
  });

  test('updates column name successfully', async () => {
    api.updateColumnName.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Column Name'));
    });
    
    expect(api.updateColumnName).toHaveBeenCalledWith('col1', 'Updated Column');
  });

  test('updates row name successfully', async () => {
    api.updateRowName.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Row Name'));
    });
    
    expect(api.updateRowName).toHaveBeenCalledWith('row1', 'Updated Row');
  });

  test('updates column WIP limit successfully', async () => {
    api.updateColumnWipLimit.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Column WIP'));
    });
    
    expect(api.updateColumnWipLimit).toHaveBeenCalledWith('col1', 4);
    expect(api.fetchColumns).toHaveBeenCalled();
  });

  test('updates row WIP limit successfully', async () => {
    api.updateRowWipLimit.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Row WIP'));
    });
    
    expect(api.updateRowWipLimit).toHaveBeenCalledWith('row1', 5);
    expect(api.fetchRows).toHaveBeenCalled();
  });

  test('handles user WIP limit operations', async () => {
    api.getUserWipLimit.mockResolvedValueOnce(5);
    api.updateUserWipLimit.mockResolvedValueOnce({ success: true });
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Get User WIP Limit'));
    });
    
    expect(api.getUserWipLimit).toHaveBeenCalledWith(1);
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update User WIP Limit'));
    });
    
    expect(api.updateUserWipLimit).toHaveBeenCalledWith(1, 10);
  });

  test('refreshes tasks successfully', async () => {
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    api.fetchTasks.mockClear();
    
    await act(async () => {
      fireEvent.click(screen.getByText('Refresh Tasks'));
    });
    
    expect(api.fetchTasks).toHaveBeenCalled();
  });

  test('refreshes entire board successfully', async () => {
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    api.fetchColumns.mockClear();
    api.fetchRows.mockClear();
    api.fetchTasks.mockClear();
    
    await act(async () => {
      fireEvent.click(screen.getByText('Refresh Board'));
    });
    
    expect(api.fetchColumns).toHaveBeenCalled();
    expect(api.fetchRows).toHaveBeenCalled();
    expect(api.fetchTasks).toHaveBeenCalled();
  });

  test('throws error when useKanban is used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useKanban must be used within a KanbanProvider');
    
    console.error = originalError;
  });

  test('handles error when updating task name fails', async () => {
    api.updateTaskName.mockRejectedValueOnce(new Error('Failed to update task name'));
    console.error = jest.fn();
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Task Name'));
    });
    
    expect(console.error).toHaveBeenCalledWith(
      'Error updating task name:',
      expect.any(Error)
    );
  });

  test('handles error when updating column name fails', async () => {
    api.updateColumnName.mockRejectedValueOnce(new Error('Failed to update column name'));
    console.error = jest.fn();
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Column Name'));
    });
    
    expect(console.error).toHaveBeenCalledWith(
      'Error updating column name:',
      expect.any(Error)
    );
  });

  test('handles error when updating row name fails', async () => {
    api.updateRowName.mockRejectedValueOnce(new Error('Failed to update row name'));
    console.error = jest.fn();
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TestComponent />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Update Row Name'));
    });
    
    expect(console.error).toHaveBeenCalledWith(
      'Error updating row name:',
      expect.any(Error)
    );
  });

  test('handles task reordering successfully', async () => {
    api.updateTaskPosition.mockResolvedValue({ success: true });
    api.fetchTasks.mockResolvedValue(mockTasks);
    
    const mockTasksInSameContainer = [
      { id: '1', title: 'Task 1', columnId: 'col1', rowId: 'row1', position: 0 },
      { id: '2', title: 'Task 2', columnId: 'col1', rowId: 'row1', position: 1 }
    ];
    
    api.fetchTasks.mockResolvedValueOnce(mockTasksInSameContainer);
    
    const TaskReorderTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="reorder-tasks"
            onClick={async () => {
              try {
                await dragAndDrop.handleTaskReorder('1', '2');
              } catch (error) {
                console.error('Reorder error:', error);
              }
            }}
          >
            Reorder Tasks
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TaskReorderTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('reorder-tasks')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('reorder-tasks'));
    });
    
    await waitFor(() => {
      expect(api.updateTaskPosition).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('handles drag start event correctly for a task', async () => {
    const dragStartTest = (mockEvent) => {
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('application/task', expect.any(String));
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    };

    await act(async () => {
      render(
        <KanbanProvider>
          <AdvancedTestComponent dragAndDropTest={dragStartTest} />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-task'));
    });
  });

  test('handles drag start event correctly for a column', async () => {
    const dragStartTest = (mockEvent) => {
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('application/column', expect.any(String));
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    };

    await act(async () => {
      render(
        <KanbanProvider>
          <AdvancedTestComponent dragAndDropTest={dragStartTest} />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-column'));
    });
  });

  test('handles drag start event correctly for a row', async () => {
    const dragStartTest = (mockEvent) => {
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('application/row', expect.any(String));
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    };

    await act(async () => {
      render(
        <KanbanProvider>
          <AdvancedTestComponent dragAndDropTest={dragStartTest} />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-row'));
    });
  });

  test('handles drop event correctly for task movement', async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/task'],
        getData: jest.fn().mockImplementation(type => {
          if (type === 'application/task') {
            return JSON.stringify({
              id: '1',
              type: 'task',
              sourceColumnId: 'col1',
              sourceRowId: 'row1'
            });
          }
          return '';
        })
      }
    };

    const DropTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="drop-button"
            onClick={() => dragAndDrop.handleDrop(mockEvent, 'col2', 'row2')}
          >
            Drop Task
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <DropTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('drop-button')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drop-button'));
    });
    
    expect(api.updateTaskColumn).toHaveBeenCalledWith('1', 'col2');
    expect(api.updateTaskRow).toHaveBeenCalledWith('1', 'row2');
  });

  test('handles drop event correctly for column reordering', async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/column'],
        getData: jest.fn().mockImplementation(type => {
          if (type === 'application/column') {
            return JSON.stringify({
              id: 'col1',
              type: 'column'
            });
          }
          return '';
        })
      }
    };
    
    const ColumnDropTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="column-drop-button"
            onClick={() => dragAndDrop.handleDrop(mockEvent, 'col2', null)}
          >
            Drop Column
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <ColumnDropTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('column-drop-button')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('column-drop-button'));
    });
    
    expect(api.updateColumnPosition).toHaveBeenCalled();
  });

  test('handles drag over event', async () => {
    const DragOverTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="drag-over-button"
            onClick={() => {
              const mockEvent = {
                preventDefault: jest.fn(),
                dataTransfer: { dropEffect: null }
              };
              dragAndDrop.handleDragOver(mockEvent);
              expect(mockEvent.preventDefault).toHaveBeenCalled();
              expect(mockEvent.dataTransfer.dropEffect).toBe('move');
            }}
          >
            Test Drag Over
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <DragOverTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('drag-over-button')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-over-button'));
    });
  });

  test('handles drag end event', async () => {
    const DragEndTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="drag-end-button"
            onClick={() => {
              const mockEvent = {
                dataTransfer: { setData: jest.fn(), effectAllowed: null },
                preventDefault: jest.fn()
              };
              dragAndDrop.handleDragStart(mockEvent, '1', 'task', 'col1', 'row1');
              
              dragAndDrop.handleDragEnd();
            }}
          >
            Test Drag End
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <DragEndTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('drag-end-button')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('drag-end-button'));
    });
  });
  
  test('handles row movement with position updates', async () => {
    api.fetchColumns.mockResolvedValue(mockColumns);
    api.fetchRows.mockResolvedValue(mockRows);
    api.fetchTasks.mockResolvedValue(mockTasks);
    api.updateRowPosition.mockResolvedValue({ success: true });
    
    const RowMovementTester = () => {
      const { moveRow, rows } = useKanban();
      
      return (
        <div>
          <div data-testid="current-rows">{rows.map(row => row.name).join(',')}</div>
          <button 
            data-testid="move-row-button"
            onClick={() => moveRow('row1', 'row2')}
          >
            Move Row
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <RowMovementTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('current-rows')).toHaveTextContent('Features,Bugs');
    });

    api.updateRowPosition.mockClear();
    await act(async () => {
      fireEvent.click(screen.getByTestId('move-row-button'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('current-rows')).toHaveTextContent('Bugs,Features');
    });

    expect(api.updateRowPosition).toHaveBeenCalledTimes(2);
    expect(api.updateRowPosition).toHaveBeenCalledWith('row2', 0);
    expect(api.updateRowPosition).toHaveBeenCalledWith('row1', 1);
  });
  
  test('handles drop event with row data correctly', async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/row'],
        getData: jest.fn().mockImplementation(type => {
          if (type === 'application/row') {
            return JSON.stringify({
              id: 'row1',
              type: 'row'
            });
          }
          return '';
        })
      }
    };
    
    const RowDropTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="row-drop-button"
            onClick={() => dragAndDrop.handleDrop(mockEvent, null, 'row2')}
          >
            Drop Row
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <RowDropTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('row-drop-button')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('row-drop-button'));
    });
    
    expect(api.updateRowPosition).toHaveBeenCalled();
  });
  
  test('handles move task with both column and row change', async () => {
    api.updateTaskColumn.mockResolvedValueOnce({ success: true });
    api.updateTaskRow.mockResolvedValueOnce({ success: true });
    
    const TaskMoveTester = () => {
      const { moveTask } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="move-task-both"
            onClick={() => moveTask('1', 'col2', 'row2')}
          >
            Move Task Both
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TaskMoveTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('move-task-both')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('move-task-both'));
    });
    
    expect(api.updateTaskColumn).toHaveBeenCalledWith('1', 'col2');
    expect(api.updateTaskRow).toHaveBeenCalledWith('1', 'row2');
  });
  
  test('handles move task with row change only', async () => {
    api.updateTaskRow.mockResolvedValueOnce({ success: true });
    
    const TaskRowMoveTester = () => {
      const { moveTask } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="move-task-row"
            onClick={() => {
              const task = mockTasks[0];
              moveTask(task.id, task.columnId, 'row2');
            }}
          >
            Move Task Row Only
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TaskRowMoveTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('move-task-row')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('move-task-row'));
    });
    
    expect(api.updateTaskColumn).not.toHaveBeenCalled();
    expect(api.updateTaskRow).toHaveBeenCalledWith('1', 'row2');
  });
  
  test('handles invalid column movement', async () => {
    console.error = jest.fn();
    
    const InvalidColumnMoveTester = () => {
      const { moveColumn } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="invalid-column-move"
            onClick={() => moveColumn('invalid-id', 'col1')}
          >
            Invalid Column Move
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <InvalidColumnMoveTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('invalid-column-move')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('invalid-column-move'));
    });
    
    expect(api.updateColumnPosition).not.toHaveBeenCalled();
  });
  
  test('handles delete last row scenario', async () => {
    api.fetchRows.mockResolvedValueOnce([mockRows[0]]);
    api.deleteRow.mockResolvedValueOnce({ success: true });
    
    const DeleteLastRowTester = () => {
      const { deleteRow } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="delete-last-row"
            onClick={() => deleteRow('row1')}
          >
            Delete Last Row
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <DeleteLastRowTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('delete-last-row')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-last-row'));
    });
    
    expect(api.updateTaskRow).toHaveBeenCalledWith(expect.any(String), null);
    expect(api.deleteRow).toHaveBeenCalledWith('row1', true);
  });
  
  test('handles task drop fallback method', async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        types: ['application/task'],
        getData: jest.fn().mockImplementation(type => {
          if (type === 'application/task') {
            throw new Error('JSON parse error');
          }
          if (type === 'taskId') return '1';
          if (type === 'columnId') return 'col1';
          return '';
        })
      }
    };
    
    const TaskDropFallbackTester = () => {
      const { dragAndDrop } = useKanban();
      
      return (
        <div>
          <button 
            data-testid="task-drop-fallback"
            onClick={() => dragAndDrop.handleDrop(mockEvent, 'col2', 'row1')}
          >
            Drop Task Fallback
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <TaskDropFallbackTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('task-drop-fallback')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('task-drop-fallback'));
    });
    
    expect(api.updateTaskColumn).toHaveBeenCalledWith('1', 'col2');
  });

  test('handles empty columns when adding a task', async () => {
    api.fetchColumns.mockResolvedValueOnce([]);
    api.addTask.mockRejectedValueOnce(new Error('Nie ma żadnej kolumny. Dodaj najpierw kolumnę.'));
    
    const ErrorBoundaryTester = () => {
      const { addTask, error } = useKanban();
      
      return (
        <div>
          {error && <div data-testid="error-message">Error: {error}</div>}
          <button 
            data-testid="add-task-empty-columns"
            onClick={() => {
              try {
                addTask('New Task');
              } catch (err) {
              }
            }}
          >
            Add Task Empty Columns
          </button>
        </div>
      );
    };
    
    await act(async () => {
      render(
        <KanbanProvider>
          <ErrorBoundaryTester />
        </KanbanProvider>
      );
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-task-empty-columns'));
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Error: notifications.noColumnError'
      );
    });
  });


});