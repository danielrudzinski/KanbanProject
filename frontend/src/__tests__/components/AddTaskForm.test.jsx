import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddTaskForm from '../../components/AddTaskForm';
import KanbanContext from '../../context/KanbanContext';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('AddTaskForm Component', () => {
    const mockAddTask = jest.fn().mockResolvedValue({});
    const mockRefreshTasks = jest.fn().mockResolvedValue([]);
    const mockOnClose = jest.fn();
    
    const mockContextValue = {
        addTask: mockAddTask,
        refreshTasks: mockRefreshTasks
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders form with correct elements', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        expect(screen.getByText('forms.addTaskForm.title')).toBeInTheDocument();
        expect(screen.getByLabelText('forms.addTaskForm.titleLabel')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('forms.addTaskForm.titlePlaceholder')).toBeInTheDocument();
        expect(screen.getByText('header.addTask')).toBeInTheDocument();
        expect(screen.getByText('taskActions.cancel')).toBeInTheDocument();
    });

    test('validates form input and shows error when title is empty', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        await act(async () => {
            fireEvent.click(screen.getByText('header.addTask'));
        });

        expect(screen.getByText('forms.addTaskForm.titleRequired')).toBeInTheDocument();
        expect(mockAddTask).not.toHaveBeenCalled();
    });

    test('submits form correctly when valid input is provided', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText('forms.addTaskForm.titleLabel'), {
            target: { value: 'New Task' }
        });
        
        await act(async () => {
            fireEvent.click(screen.getByText('header.addTask'));
        });
        
    expect(mockAddTask).toHaveBeenCalledWith('New Task', null, null, null);
        expect(mockRefreshTasks).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('handles API errors correctly', async () => {
        const errorContext = {
            ...mockContextValue,
            addTask: jest.fn().mockRejectedValue(new Error('API Error'))
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );

        fireEvent.change(screen.getByLabelText('forms.addTaskForm.titleLabel'), {
            target: { value: 'Error Task' }
        });
        
        await act(async () => {
            fireEvent.click(screen.getByText('header.addTask'));
        });
        
        expect(screen.getByText('API Error')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('handles default error message when API throws without message', async () => {
        const errorContext = {
            ...mockContextValue,
            addTask: jest.fn().mockRejectedValue(new Error())
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText('forms.addTaskForm.titleLabel'), {
            target: { value: 'Error Task' }
        });

        await act(async () => {
            fireEvent.click(screen.getByText('header.addTask'));
        });
        
        expect(screen.getByText('forms.addTaskForm.addError')).toBeInTheDocument();
    });

    test('disables form controls during submission', async () => {
        const delayedContext = {
            ...mockContextValue,
            addTask: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };
        
        render(
            <KanbanContext.Provider value={delayedContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText('forms.addTaskForm.titleLabel'), {
            target: { value: 'Test Task' }
        });
        
        act(() => {
            fireEvent.click(screen.getByText('header.addTask'));
        });
        
        expect(screen.getByText('forms.addTaskForm.adding')).toBeInTheDocument();
        
        expect(screen.getByLabelText('forms.addTaskForm.titleLabel')).toBeDisabled();
        expect(screen.getByText('forms.addTaskForm.adding')).toBeDisabled();
        expect(screen.getByText('taskActions.cancel')).toBeDisabled();
    });

    test('closes form when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('taskActions.cancel'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes form when close button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByLabelText('forms.addRowColumn.close'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});