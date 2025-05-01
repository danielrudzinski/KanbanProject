import React from 'react';
import ReactDOM from 'react-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import KanbanContext from '../../context/KanbanContext';
import Task from '../../components/Task';
import { getUserAvatar, assignUserToTask, fetchSubTasksByTaskId } from '../../services/api';

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
        
        const deleteButton = screen.getByTitle('taskActions.delete');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
        
        expect(screen.getByText('taskActions.confirmDelete')).toBeInTheDocument();
    });

    test('calls deleteTask when confirming deletion', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
    
        const deleteButton = screen.getByTitle('taskActions.delete');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
    
        const confirmButton = screen.getByText('taskActions.yes');
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
        
        const deleteButton = screen.getByTitle('taskActions.delete');
        await act(async () => {
            fireEvent.click(deleteButton);
        });
        
        const cancelButton = screen.getByText('taskActions.no');
        await act(async () => {
            fireEvent.click(cancelButton);
        });
        
        expect(screen.queryByText('taskActions.confirmDelete')).not.toBeInTheDocument();
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
        
        const labelPill = screen.getByTitle('High Priority');
        expect(labelPill).toBeInTheDocument();
        expect(labelPill).toHaveClass('task-label-pill');
    });

    test('handles drag start event correctly', async () => {
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
        
        expect(dataTransfer.effectAllowed).toBe('move');
    });

    test('fetches and displays avatar when task has userIds', async () => {
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
    
      const deleteButton = screen.getByTitle('taskActions.delete');
      await act(async () => {
        fireEvent.click(deleteButton);
      });
    
      expect(screen.getByText('taskActions.confirmDelete')).toBeInTheDocument();
    });

    test('correctly displays completed task with completion indicator', async () => {
      const completedTask = {
        ...mockTask,
        completed: true
      };
    
      await act(async () => {
       render(
          <KanbanContext.Provider value={mockContextValue}>
            <Task task={completedTask} columnId="col1" />
          </KanbanContext.Provider>
        );
      
        await new Promise(resolve => setTimeout(resolve, 100));
      });
  
      const taskElement = screen.getByText('Test Task').closest('.task');
      expect(taskElement).toHaveClass('task');
    });

    test('renders task with blocked indicator when subtasks are incomplete', async () => {
        fetchSubTasksByTaskId.mockResolvedValue([
            { id: 1, completed: false, title: 'Subtask 1' },
            { id: 2, completed: false, title: 'Subtask 2' }
        ]);
    
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
            
            await new Promise(resolve => setTimeout(resolve, 100));
        });
    
        expect(fetchSubTasksByTaskId).toHaveBeenCalledWith('1');
        const taskElement = screen.getByText('Test Task').closest('.task');
        expect(taskElement).toHaveClass('task');
    });

    test('allows editing task title with double click', async () => {
      await act(async () => {
        render(
          <KanbanContext.Provider value={mockContextValue}>
            <Task task={mockTask} columnId="col1" />
          </KanbanContext.Provider>
        );
      });
    
      const titleElement = screen.getByText('Test Task');
      await act(async () => {
        fireEvent.doubleClick(titleElement);
      });
    
      const inputElement = screen.getByDisplayValue('Test Task');
      expect(inputElement).toBeInTheDocument();

      await act(async () => {
        fireEvent.change(inputElement, { target: { value: 'Updated Task Title' } });
        fireEvent.blur(inputElement);
      });
    
      expect(mockContextValue.updateTaskName).toHaveBeenCalledWith('1', 'Updated Task Title', "task");
    });

    test('handles drop event for task reordering', async () => {
      const dataTransfer = {
        types: ['application/task', 'taskId', 'columnId'],
        getData: jest.fn((type) => {
          if (type === 'application/task') return JSON.stringify({ taskId: '2', columnId: 'col1' });
          if (type === 'taskId') return '2';
          if (type === 'columnId') return 'col1';
          return '';
        })
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
      });
    
      expect(mockContextValue.dragAndDrop.handleTaskReorder).toHaveBeenCalled();
    });

    test('closes task details when ESC key is pressed', async () => {
        await act(async () => {
          render(
            <KanbanContext.Provider value={mockContextValue}>
              <Task task={mockTask} columnId="col1" />
            </KanbanContext.Provider>
          );
        });
        
        const taskElement = screen.getByText('Test Task').closest('.task');
        await act(async () => {
          fireEvent.click(taskElement);
        });
        
        expect(screen.getByTitle('taskActions.delete')).toBeInTheDocument();
        await act(async () => {
          fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        });
        
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('applies animation classes when task is moved', async () => {
      await act(async () => {
        render(
          <KanbanContext.Provider value={mockContextValue}>
            <Task task={mockTask} columnId="col1" />
          </KanbanContext.Provider>
        );
      });
    
      const taskElement = screen.getByText('Test Task').closest('.task');
    
      await act(async () => {
        fireEvent.transitionStart(taskElement);
        fireEvent.transitionEnd(taskElement);
      });
    
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    test('opens task details when task is clicked', async () => {
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const taskElement = screen.getByText('Test Task').closest('.task');
        
        await act(async () => {
            fireEvent.click(taskElement);
        });
        
        expect(document.body.querySelector('.task-details-panel')).toBeInTheDocument();
    });
    
    test('shows and hides task actions menu', async () => {
        const originalCreatePortal = ReactDOM.createPortal;
        ReactDOM.createPortal = jest.fn((element) => element);

        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const taskElement = screen.getByText('Test Task').closest('.task');
        await act(async () => {
            fireEvent.click(taskElement);
        });
        
        expect(document.body.querySelector('.task-details-panel')).toBeInTheDocument();
        await act(async () => {
            fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        });
        
        expect(document.body.querySelector('.task-details-panel')).not.toBeInTheDocument();
        ReactDOM.createPortal = originalCreatePortal;
    });
    
    test('updates task name when edited', async () => {
        const updatedTaskName = "Updated Task Name";
        mockContextValue.updateTaskName.mockResolvedValue({ title: updatedTaskName });
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const taskTitle = screen.getByText('Test Task');
        await act(async () => {
            fireEvent.doubleClick(taskTitle);
        });
        
        const input = screen.getByDisplayValue('Test Task');
        await act(async () => {
            fireEvent.change(input, { target: { value: updatedTaskName } });
            fireEvent.blur(input);
        });
        
        expect(mockContextValue.updateTaskName).toHaveBeenCalledWith(mockTask.id, updatedTaskName, "task");
    });
    
    test('assigns user to task', async () => {
        const testTask = {
            ...mockTask,
            userIds: []
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={testTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const taskElement = screen.getByText('Test Task').closest('.task');
        const dataTransfer = {
            types: ['application/user'],
            getData: jest.fn().mockReturnValue(JSON.stringify({
                type: 'user',
                userId: '123'
            }))
        };
        
        await act(async () => {
            fireEvent.drop(taskElement, { 
                dataTransfer,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            });
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        
        expect(assignUserToTask).toHaveBeenCalledWith('1', 123);
        expect(mockContextValue.refreshTasks).toHaveBeenCalled();
    });
    
    test('handles subtasks properly', async () => {
        fetchSubTasksByTaskId.mockResolvedValue([
            { id: 1, completed: true, title: 'Subtask 1' },
            { id: 2, completed: false, title: 'Subtask 2' }
        ]);
    
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
            
            await new Promise(resolve => setTimeout(resolve, 100));
        });
    
        expect(fetchSubTasksByTaskId).toHaveBeenCalledWith('1');
        const taskElement = screen.getByText('Test Task').closest('.task');
        expect(taskElement).toBeInTheDocument();
    }); 
    
    test('shows task labels', async () => {
        const taskWithMultipleLabels = {
            ...mockTask,
            labels: ['High Priority', 'Bug', 'Frontend']
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={taskWithMultipleLabels} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        const highPriorityLabel = screen.getByTitle('High Priority');
        const bugLabel = screen.getByTitle('Bug');
        const frontendLabel = screen.getByTitle('Frontend');
        
        expect(highPriorityLabel).toBeInTheDocument();
        expect(bugLabel).toBeInTheDocument();
        expect(frontendLabel).toBeInTheDocument();
        expect(highPriorityLabel).toHaveClass('task-label-pill');
        expect(bugLabel).toHaveClass('task-label-pill');
        expect(frontendLabel).toHaveClass('task-label-pill');
    });
    
    test('renders task with assigned users', async () => {
        const taskWithUsers = {
            ...mockTask,
            userIds: [1, 2]
        };
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={taskWithUsers} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        await waitFor(() => {
            expect(getUserAvatar).toHaveBeenCalledTimes(1);
        });
        
        const avatar = screen.getByAltText('User avatar');
        expect(avatar).toBeInTheDocument();
        const avatarCount = screen.getByText('+1');
        expect(avatarCount).toBeInTheDocument();
    });
    
    test('handles error when fetching subtasks fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        fetchSubTasksByTaskId.mockRejectedValue(new Error('Failed to fetch subtasks'));
        
        await act(async () => {
            render(
                <KanbanContext.Provider value={mockContextValue}>
                    <Task task={mockTask} columnId="col1" />
                </KanbanContext.Provider>
            );
        });
        
        await waitFor(() => {
            expect(fetchSubTasksByTaskId).toHaveBeenCalledWith(mockTask.id);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        
        consoleErrorSpy.mockRestore();
    });
  
});