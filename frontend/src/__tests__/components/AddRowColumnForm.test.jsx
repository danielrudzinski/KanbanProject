import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddRowColumnForm from '../../components/AddRowColumnForm';
import KanbanContext from '../../context/KanbanContext';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

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
        
        expect(screen.getByText('forms.addRowColumn.title')).toBeInTheDocument();
        const columnTab = screen.getByText('forms.addRowColumn.tabs.columns');
        const rowTab = screen.getByText('forms.addRowColumn.tabs.rows');
        expect(columnTab).toBeInTheDocument();
        expect(rowTab).toBeInTheDocument();
        expect(columnTab).toHaveClass('active');
        expect(rowTab).not.toHaveClass('active');
        expect(screen.getByLabelText('forms.addRowColumn.nameLabel.column')).toBeInTheDocument();
        expect(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i)).toBeInTheDocument();
        expect(screen.getByText('forms.addRowColumn.submit.column')).toBeInTheDocument();
        expect(screen.getByText('forms.wipLimit.cancel')).toBeInTheDocument();
    });

    test('switches between column and row tabs correctly', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const columnTab = screen.getByText('forms.addRowColumn.tabs.columns');
        const rowTab = screen.getByText('forms.addRowColumn.tabs.rows');
        expect(columnTab).toHaveClass('active');
        
        fireEvent.click(rowTab);
        expect(rowTab).toHaveClass('active');
        expect(columnTab).not.toHaveClass('active');
        
        expect(screen.getByLabelText('forms.addRowColumn.nameLabel.row')).toBeInTheDocument();
        expect(screen.getByText('forms.addRowColumn.submit.row')).toBeInTheDocument();
    });

    test('validates form input and shows error when name is empty', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        await act(async () => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.column'));
        });
        expect(screen.getByText('forms.addRowColumn.error.nameRequired.column')).toBeInTheDocument();
        expect(mockAddColumn).not.toHaveBeenCalled();
    });

    test('submits form correctly when adding a column', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.column'), { target: { value: 'New Column' } });
        fireEvent.change(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i), { target: { value: '5' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.column'));
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
        
        fireEvent.click(screen.getByText('forms.addRowColumn.tabs.rows'));
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.row'), { target: { value: 'New Row' } });
        fireEvent.change(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i), { target: { value: '3' } });
    
        await act(async () => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.row'));
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
        
        fireEvent.click(screen.getByText('forms.wipLimit.cancel'));
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
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.column'), { target: { value: 'Error Column' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.column'));
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
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.column'), { target: { value: 'Error Column' } });

        await act(async () => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.column'));
        });
        expect(screen.getByText('forms.addRowColumn.error.addFailed.column')).toBeInTheDocument();
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
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.column'), { target: { value: 'Test Column' } });
        
        act(() => {
            fireEvent.click(screen.getByText('forms.addRowColumn.submit.column'));
        });
        
        expect(screen.getByText('forms.addRowColumn.submitting')).toBeInTheDocument();
        expect(screen.getByLabelText('forms.addRowColumn.nameLabel.column')).toBeDisabled();
        expect(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i)).toBeDisabled();
        expect(screen.getByText('forms.addRowColumn.submitting')).toBeDisabled();
        expect(screen.getByText('forms.wipLimit.cancel')).toBeDisabled();
    });

    test('resets form fields when switching tabs', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <AddRowColumnForm onClose={mockOnClose} /> 
            </KanbanContext.Provider>
        );
        
        fireEvent.change(screen.getByLabelText('forms.addRowColumn.nameLabel.column'), { target: { value: 'Test Column' } });
        fireEvent.change(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i), { target: { value: '5' } });
        
        fireEvent.click(screen.getByText('forms.addRowColumn.tabs.rows'));
        
        expect(screen.getByLabelText('forms.addRowColumn.nameLabel.row').value).toBe('');
        expect(screen.getByLabelText(/forms\.wipLimit\.limitLabel/i).value).toBe('0');
    });
});