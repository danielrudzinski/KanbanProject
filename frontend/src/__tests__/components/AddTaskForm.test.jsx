import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddTaskForm from '../../components/AddTaskForm';
import KanbanContext from '../../context/KanbanContext';

describe('AddTaskForm Component', () => {
    // Mocked context values and functions
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
        
        // Check header is present
        expect(screen.getByText('Dodaj nowe zadanie')).toBeInTheDocument();
        
        // Check form controls are present
        expect(screen.getByLabelText(/Tytuł zadania:/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Wpisz tytuł zadania')).toBeInTheDocument();
        
        // Check buttons are present
        expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
        expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });

    test('validates form input and shows error when title is empty', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Submit form without entering a title
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        // Should show validation error
        expect(screen.getByText('Tytuł zadania jest wymagany!')).toBeInTheDocument();
        
        // addTask should not have been called
        expect(mockAddTask).not.toHaveBeenCalled();
    });

    test('submits form correctly when valid input is provided', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'New Task' }
        });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        // Check addTask was called with correct arguments
        expect(mockAddTask).toHaveBeenCalledWith('New Task');
        
        // Check refreshTasks was called
        expect(mockRefreshTasks).toHaveBeenCalled();
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('handles API errors correctly', async () => {
        // Create a context with a failing addTask function
        const errorContext = {
            ...mockContextValue,
            addTask: jest.fn().mockRejectedValue(new Error('API Error'))
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Error Task' }
        });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        // Check error message is displayed
        expect(screen.getByText('API Error')).toBeInTheDocument();
        
        // Check onClose was not called
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('handles default error message when API throws without message', async () => {
        // Create a context with a failing addTask function without error message
        const errorContext = {
            ...mockContextValue,
            addTask: jest.fn().mockRejectedValue(new Error())
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Error Task' }
        });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        // Check default error message is displayed
        expect(screen.getByText('Wystąpił błąd podczas dodawania zadania')).toBeInTheDocument();
    });

    test('disables form controls during submission', async () => {
        // Create a context with a delayed resolution to test loading state
        const delayedContext = {
            ...mockContextValue,
            addTask: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };
        
        render(
            <KanbanContext.Provider value={delayedContext}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Test Task' }
        });
        
        // Submit form but don't wait for resolution
        act(() => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        // Check button text changes to loading state
        expect(screen.getByText('Dodawanie...')).toBeInTheDocument();
        
        // Check form controls are disabled
        expect(screen.getByLabelText(/Tytuł zadania:/i)).toBeDisabled();
        expect(screen.getByText('Dodawanie...')).toBeDisabled();
        expect(screen.getByText('Anuluj')).toBeDisabled();
    });

    test('closes form when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Click the cancel button
        fireEvent.click(screen.getByText('Anuluj'));
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes form when close button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddTaskForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Click the close button (×)
        fireEvent.click(screen.getByLabelText('Zamknij formularz'));
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });
});