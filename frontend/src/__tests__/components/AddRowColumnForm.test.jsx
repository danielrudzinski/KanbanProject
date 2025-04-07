import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddRowColumnForm from '../../components/AddRowColumnForm';
import KanbanContext from '../../context/KanbanContext';

describe('AddRowColumnForm Component', () => {
    // Mocked context values and functions
    const mockAddColumn = jest.fn().mockResolvedValue({});
    const mockAddRow = jest.fn().mockResolvedValue({});
    const mockOnClose = jest.fn();
    
    const mockContextValue = {
        addColumn: mockAddColumn,
        addRow: mockAddRow
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders form with column tab active by default', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Check header is present
        expect(screen.getByText('Dodaj nowy wiersz/kolumnę')).toBeInTheDocument();
        
        // Check tabs are present
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toBeInTheDocument();
        expect(rowTab).toBeInTheDocument();
        
        // Check column tab is active by default
        expect(columnTab).toHaveClass('active');
        expect(rowTab).not.toHaveClass('active');
        
        // Check form fields are present
        expect(screen.getByLabelText(/Nazwa kolumny:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Limit WIP/i)).toBeInTheDocument();
        
        // Check buttons are present
        expect(screen.getByText('Dodaj kolumnę')).toBeInTheDocument();
        expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });

    test('switches between column and row tabs correctly', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Initially, column tab should be active
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toHaveClass('active');
        
        // Click on the row tab
        fireEvent.click(rowTab);
        
        // Now row tab should be active
        expect(rowTab).toHaveClass('active');
        expect(columnTab).not.toHaveClass('active');
        
        // Label should change to reflect row selection
        expect(screen.getByLabelText(/Nazwa wiersza:/i)).toBeInTheDocument();
        expect(screen.getByText('Dodaj wiersz')).toBeInTheDocument();
    });

    test('validates form input and shows error when name is empty', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Submit form without entering a name
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        // Should show validation error
        expect(screen.getByText('Nazwa kolumny jest wymagana!')).toBeInTheDocument();
        
        // addColumn should not have been called
        expect(mockAddColumn).not.toHaveBeenCalled();
    });

    test('submits form correctly when adding a column', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'New Column' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '5' } });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        // Check addColumn was called with correct arguments
        expect(mockAddColumn).toHaveBeenCalledWith('New Column', '5');
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('submits form correctly when adding a row', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Switch to row tab
        fireEvent.click(screen.getByText('Wiersze'));
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Nazwa wiersza:/i), { target: { value: 'New Row' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '3' } });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj wiersz'));
        });
        
        // Check addRow was called with correct arguments
        expect(mockAddRow).toHaveBeenCalledWith('New Row', 3);
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes form when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Click the cancel button
        fireEvent.click(screen.getByText('Anuluj'));
        
        // Check onClose was called
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('shows error message when API call fails', async () => {
        // Create a context with a failing addColumn function
        const errorContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockRejectedValue(new Error('API Error'))
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Error Column' } });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        // Check error message is displayed
        expect(screen.getByText('API Error')).toBeInTheDocument();
        
        // Check onClose was not called
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('handles default error message when API throws without message', async () => {
        // Create a context with a failing addColumn function without error message
        const errorContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockRejectedValue(new Error())
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Error Column' } });
        
        // Submit form
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        // Check default error message is displayed
        expect(screen.getByText('Wystąpił błąd podczas dodawania kolumny')).toBeInTheDocument();
    });

    test('disables form controls during submission', async () => {
        // Create a context with a delayed resolution to test loading state
        const delayedContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };
        
        render(
            <KanbanContext.Provider value={delayedContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Test Column' } });
        
        // Submit form but don't wait for resolution
        act(() => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        // Check button text changes to loading state
        expect(screen.getByText('Dodawanie...')).toBeInTheDocument();
        
        // Check form controls are disabled
        expect(screen.getByLabelText(/Nazwa kolumny:/i)).toBeDisabled();
        expect(screen.getByLabelText(/Limit WIP/i)).toBeDisabled();
        expect(screen.getByText('Dodawanie...')).toBeDisabled();
        expect(screen.getByText('Anuluj')).toBeDisabled();
    });

    test('resets form fields when switching tabs', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        // Fill in the form for column
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Test Column' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '5' } });
        
        // Switch to row tab
        fireEvent.click(screen.getByText('Wiersze'));
        
        // Check form fields are reset
        expect(screen.getByLabelText(/Nazwa wiersza:/i).value).toBe('');
        expect(screen.getByLabelText(/Limit WIP/i).value).toBe('0');
    });
});