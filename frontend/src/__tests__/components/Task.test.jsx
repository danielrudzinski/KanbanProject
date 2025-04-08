import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KanbanContext from '../../context/KanbanContext';
import Task from '../../components/Task';
import { getUserAvatar, assignUserToTask, fetchSubTasksByTaskId } from '../../services/api';

// Mock the services
jest.mock('../../services/api', () => ({
    getUserAvatar: jest.fn().mockResolvedValue('mocked-avatar-url'),
    assignUserToTask: jest.fn().mockResolvedValue({}),
    fetchSubTasksByTaskId: jest.fn().mockResolvedValue([])
}));

describe('Task Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const mockTask = {
        id: '1',
        title: 'Test Task',
        userIds: [],
        labels: ['High Priority'],
        columnId: 'col1',
        rowId: 'row1',
    };
    
    const mockContextValue = {
        deleteTask: jest.fn(),
        refreshTasks: jest.fn(),
        updateTaskName: jest.fn(),
        dragAndDrop: {
            handleTaskReorder: jest.fn(),
            handleDragStart: jest.fn(),
            handleDragOver: jest.fn(),
            handleDrop: jest.fn(),
            handleDragEnd: jest.fn(),
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders task with correct title', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('shows delete confirmation when delete button is clicked', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const deleteButton = screen.getByTitle('Usuń zadanie');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
        
        expect(screen.getByText('Czy na pewno chcesz usunąć to zadanie?')).toBeInTheDocument();
    });

    test('calls deleteTask when confirming deletion', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
    
        const deleteButton = screen.getByTitle('Usuń zadanie');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
    
        const confirmButton = screen.getByText('Tak');
        await act(async () => {
            fireEvent.click(confirmButton);
        });

        await waitFor(() => {
            expect(mockContextValue.deleteTask).toHaveBeenCalledWith('1');
        });
    });

    test('cancels deletion when cancel button is clicked', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const deleteButton = screen.getByTitle('Usuń zadanie');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
        
        const cancelButton = screen.getByText('Nie');
        await act(async () => {
            fireEvent.click(cancelButton);
        });
        
        expect(screen.queryByText('Czy na pewno chcesz usunąć to zadanie?')).not.toBeInTheDocument();
        expect(mockContextValue.deleteTask).not.toHaveBeenCalled();
    });

    test('renders labels correctly', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        // Task should have a label pill with title "High Priority"
        const labelPill = screen.getByTitle('High Priority');
        expect(labelPill).toBeInTheDocument();
        expect(labelPill).toHaveClass('task-label-pill');
    });

    test('handles drag start event correctly', async () => {
        // Mock dataTransfer
        const dataTransfer = {
            setData: jest.fn(),
            effectAllowed: null
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        const taskElement = screen.getByText('Test Task').closest('.task');
        
        await act(async () => {
            fireEvent.dragStart(taskElement, { dataTransfer });
        });

        expect(dataTransfer.setData).toHaveBeenCalledWith('application/task', expect.any(String));
        expect(dataTransfer.setData).toHaveBeenCalledWith('taskId', '1');
        expect(dataTransfer.setData).toHaveBeenCalledWith('columnId', 'col1');
        
        // Check effectAllowed was set
        expect(dataTransfer.effectAllowed).toBe('move');
    });

    test('fetches and displays avatar when task has userIds', async () => {
        // Create a task with users
        const taskWithUser = {
            ...mockTask,
            userIds: ['123']
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={taskWithUser} columnId="col1" />
                </KanbanContext.Provider>
            );
            
            // Wait for the avatar fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(getUserAvatar).toHaveBeenCalledWith('123');
        const avatar = screen.getByAltText('User avatar');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveClass('avatar-preview');
    });

    test('checks for unfinished subtasks on mount', async () => {
        fetchSubTasksByTaskId.mockResolvedValue([
            { id: 1, completed: false, title: 'Subtask 1' }
        ]);
    
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(fetchSubTasksByTaskId).toHaveBeenCalledWith('1');
    });

    test('handles user assignment when user is dropped on task', async () => {
        const dataTransfer = {
            types: ['application/user'],
            getData: jest.fn().mockReturnValue(JSON.stringify({
                type: 'user',
                userId: '123'
            }))
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const taskElement = screen.getByText('Test Task').closest('.task');
        await act(async () => {
            fireEvent.drop(taskElement, { dataTransfer });
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(assignUserToTask).toHaveBeenCalledWith('1', 123);
    });

    test('renders task with correct title', async () => {
        await act(async () => {
          render(
            <KanbanContext.Provider value={mockContextValue}>
              <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
          );
          await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

  test('shows delete confirmation when delete button is clicked', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <Task task={mockTask} columnId="col1" />
        </KanbanContext.Provider>
      );
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const deleteButton = screen.getByTitle('Usuń zadanie');
    await act(async () => {
      fireEvent.click(deleteButton);
    });
    
    expect(screen.getByText('Czy na pewno chcesz usunąć to zadanie?')).toBeInTheDocument();
  });
  
});