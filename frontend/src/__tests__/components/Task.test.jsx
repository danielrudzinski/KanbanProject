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

    test('renders task with correct title', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('shows delete confirmation when delete button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Find and click the delete button
        const deleteButton = screen.getByTitle('Usuń zadanie');
        fireEvent.click(deleteButton);
        
        // Check if confirmation dialog appears
        expect(screen.getByText('Czy na pewno chcesz usunąć to zadanie?')).toBeInTheDocument();
    });

    test('calls deleteTask when confirming deletion', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
    
        const deleteButton = screen.getByTitle('Usuń zadanie');
        fireEvent.click(deleteButton);
    
        const confirmButton = screen.getByText('Tak');
        fireEvent.click(confirmButton);
    
        await waitFor(() => {
            expect(mockContextValue.deleteTask).toHaveBeenCalledWith('1');
        });
    });

    test('cancels deletion when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Find and click the delete button
        const deleteButton = screen.getByTitle('Usuń zadanie');
        fireEvent.click(deleteButton);
        
        // Find and click the cancel button
        const cancelButton = screen.getByText('Nie');
        fireEvent.click(cancelButton);
        
        // Check that confirmation dialog is no longer displayed
        expect(screen.queryByText('Czy na pewno chcesz usunąć to zadanie?')).not.toBeInTheDocument();
        
        // Check that deleteTask was not called
        expect(mockContextValue.deleteTask).not.toHaveBeenCalled();
    });

    test('renders labels correctly', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Task should have a label pill with title "High Priority"
        const labelPill = screen.getByTitle('High Priority');
        expect(labelPill).toBeInTheDocument();
        expect(labelPill).toHaveClass('task-label-pill');
    });

    test('handles drag start event correctly', () => {
        // Mock dataTransfer
        const dataTransfer = {
            setData: jest.fn(),
            effectAllowed: null
        };
        
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Find the task element
        const taskElement = screen.getByText('Test Task').closest('.task');
        
        // Simulate drag start
        fireEvent.dragStart(taskElement, { dataTransfer });
        
        // Check that dataTransfer.setData was called correctly
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
        
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={taskWithUser} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Check that getUserAvatar was called with the correct user id
        expect(getUserAvatar).toHaveBeenCalledWith('123');
        
        // Wait for the avatar to be displayed
        await waitFor(() => {
            const avatar = screen.getByAltText('User avatar');
            expect(avatar).toBeInTheDocument();
            expect(avatar).toHaveClass('avatar-preview');
        });
    });

    test('checks for unfinished subtasks on mount', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
    
        expect(fetchSubTasksByTaskId).toHaveBeenCalledWith('1');
    });

    test('handles user assignment when user is dropped on task', async () => {
        // Mock dataTransfer
        const dataTransfer = {
            types: ['application/user'],
            getData: jest.fn().mockReturnValue(JSON.stringify({
                type: 'user',
                userId: '123'
            }))
        };
        
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
        );
        
        // Find the task element
        const taskElement = screen.getByText('Test Task').closest('.task');
        
        // Simulate drop
        await fireEvent.drop(taskElement, { dataTransfer });
    });

  test('renders task with correct title', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Task task={mockTask} columnId="col1" />
      </KanbanContext.Provider>
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  test('shows delete confirmation when delete button is clicked', () => {
    render(
      <KanbanContext.Provider value={mockContextValue}>
        <Task task={mockTask} columnId="col1" />
      </KanbanContext.Provider>
    );
    
    // Find and click the delete button
    const deleteButton = screen.getByTitle('Usuń zadanie');
    fireEvent.click(deleteButton);
    
    // Check if confirmation dialog appears
    expect(screen.getByText('Czy na pewno chcesz usunąć to zadanie?')).toBeInTheDocument();
  });
});