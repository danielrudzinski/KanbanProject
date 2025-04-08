import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddRowColumnForm from '../../components/AddRowColumnForm';
import KanbanContext from '../../context/KanbanContext';

describe('AddRowColumnForm Component', () => {
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
        
        expect(screen.getByText('Dodaj nowy wiersz/kolumnę')).toBeInTheDocument();
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toBeInTheDocument();
        expect(rowTab).toBeInTheDocument();
        expect(columnTab).toHaveClass('active');
        expect(rowTab).not.toHaveClass('active');
        expect(screen.getByLabelText(/Nazwa kolumny:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Limit WIP/i)).toBeInTheDocument();
        expect(screen.getByText('Dodaj kolumnę')).toBeInTheDocument();
        expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });

    test('switches between column and row tabs correctly', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toHaveClass('active');
        
        fireEvent.click(rowTab);
        expect(rowTab).toHaveClass('active');
        expect(columnTab).not.toHaveClass('active');
        
        expect(screen.getByLabelText(/Nazwa wiersza:/i)).toBeInTheDocument();
        expect(screen.getByText('Dodaj wiersz')).toBeInTheDocument();
    });

    test('validates form input and shows error when name is empty', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        expect(screen.getByText('Nazwa kolumny jest wymagana!')).toBeInTheDocument();
        expect(mockAddColumn).not.toHaveBeenCalled();
    });

    test('submits form correctly when adding a column', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'New Column' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '5' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        expect(mockAddColumn).toHaveBeenCalledWith('New Column', '5');
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('submits form correctly when adding a row', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        fireEvent.change(screen.getByLabelText(/Nazwa wiersza:/i), { target: { value: 'New Row' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '3' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj wiersz'));
        });
        
        expect(mockAddRow).toHaveBeenCalledWith('New Row', 3);
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes form when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Anuluj'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('shows error message when API call fails', async () => {
        const errorContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockRejectedValue(new Error('API Error'))
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Error Column' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });

        expect(screen.getByText('API Error')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('handles default error message when API throws without message', async () => {
        const errorContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockRejectedValue(new Error())
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Error Column' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        expect(screen.getByText('Wystąpił błąd podczas dodawania kolumny')).toBeInTheDocument();
    });

    test('disables form controls during submission', async () => {
        const delayedContext = {
            ...mockContextValue,
            addColumn: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };
        
        render(
            <KanbanContext.Provider value={delayedContext}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Test Column' } });
        
        act(() => {
            fireEvent.click(screen.getByText('Dodaj kolumnę'));
        });
        
        expect(screen.getByText('Dodawanie...')).toBeInTheDocument();
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
        
        fireEvent.change(screen.getByLabelText(/Nazwa kolumny:/i), { target: { value: 'Test Column' } });
        fireEvent.change(screen.getByLabelText(/Limit WIP/i), { target: { value: '5' } });
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        expect(screen.getByLabelText(/Nazwa wiersza:/i).value).toBe('');
        expect(screen.getByLabelText(/Limit WIP/i).value).toBe('0');
    });
});