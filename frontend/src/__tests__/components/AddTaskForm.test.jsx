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
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });

        expect(screen.getByText('Tytuł zadania jest wymagany!')).toBeInTheDocument();
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
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        expect(mockAddTask).toHaveBeenCalledWith('New Task');
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
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Error Task' }
        });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        expect(screen.getByText('API Error')).toBeInTheDocument();
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
        
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Error Task' }
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
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
        
        fireEvent.change(screen.getByLabelText(/Tytuł zadania:/i), {
            target: { value: 'Test Task' }
        });
        
        act(() => {
            fireEvent.click(screen.getByText('Dodaj zadanie'));
        });
        
        expect(screen.getByText('Dodawanie...')).toBeInTheDocument();
        
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