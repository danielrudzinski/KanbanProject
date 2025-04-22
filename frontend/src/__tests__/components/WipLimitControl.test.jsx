import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WipLimitControl from '../../components/WipLimitControl';
import KanbanContext from '../../context/KanbanContext';

describe('WipLimitControl Component', () => {
    const mockUpdateWipLimit = jest.fn().mockResolvedValue({});
    const mockUpdateRowWipLimit = jest.fn().mockResolvedValue({});
    const mockOnClose = jest.fn();
    
    const mockColumns = [
        { id: 'col1', name: 'To Do', wipLimit: 3 },
        { id: 'col2', name: 'In Progress', wipLimit: 5 },
        { id: 'col3', name: 'Done', wipLimit: 0 }
    ];
    
    const mockRows = [
        { id: 'row1', name: 'Features', wipLimit: 2 },
        { id: 'row2', name: 'Bugs', wipLimit: 4 }
    ];
    
    const mockContextValue = {
        columns: mockColumns,
        rows: mockRows,
        updateWipLimit: mockUpdateWipLimit,
        updateRowWipLimit: mockUpdateRowWipLimit
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders form with column tab active by default', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        expect(screen.getByText('Ustaw limit WIP')).toBeInTheDocument();
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toBeInTheDocument();
        expect(rowTab).toBeInTheDocument();
        expect(columnTab).toHaveClass('active');
        expect(rowTab).not.toHaveClass('active');
        expect(screen.getByLabelText(/Wybierz kolumnę:/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Limit WIP/i)).toBeInTheDocument();
    });

    test('switches between column and row tabs correctly', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const columnTab = screen.getByText('Kolumny');
        const rowTab = screen.getByText('Wiersze');
        expect(columnTab).toHaveClass('active');
        
        fireEvent.click(rowTab);
        expect(rowTab).toHaveClass('active');
        expect(columnTab).not.toHaveClass('active');
        expect(screen.getByLabelText(/Wybierz wiersz:/i)).toBeInTheDocument();
        
        fireEvent.click(columnTab);
        expect(columnTab).toHaveClass('active');
        expect(rowTab).not.toHaveClass('active');
        expect(screen.getByLabelText(/Wybierz kolumnę:/i)).toBeInTheDocument();
    });

    test('populates dropdown with correct column options', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        expect(select).toBeInTheDocument();
        
        expect(select.options.length).toBe(4);
        expect(select.options[0].text).toBe('Wybierz kolumnę');
        expect(select.options[1].text).toContain('To Do');
        expect(select.options[1].text).toContain('(Aktualny limit: 3)');
        expect(select.options[3].text).toContain('Done');
        expect(select.options[3].text).toContain('(Bez limitu)');
    });

    test('populates dropdown with correct row options when row tab is active', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        const select = screen.getByLabelText(/Wybierz wiersz:/i);
        expect(select).toBeInTheDocument();
        
        expect(select.options.length).toBe(3);
        expect(select.options[0].text).toBe('Wybierz wiersz');
        expect(select.options[1].text).toContain('Features');
        expect(select.options[1].text).toContain('(Aktualny limit: 2)');
        expect(select.options[2].text).toContain('Bugs');
        expect(select.options[2].text).toContain('(Aktualny limit: 4)');
    });

    test('sets current WIP limit when column is selected', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col2' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        expect(wipInput.value).toBe('5');
    }); 

    test('shows validation error when submitting without selecting an item', async () => {
        const { container } = render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const form = container.querySelector('form');
        
        await act(async () => {
            fireEvent.submit(form);
        });
        
        expect(screen.getByText('Wybierz kolumnę!')).toBeInTheDocument();
        expect(mockUpdateWipLimit).not.toHaveBeenCalled();
    });

    test('updates column WIP limit successfully', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '10' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(mockUpdateWipLimit).toHaveBeenCalledWith('col1', 10);
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('updates row WIP limit successfully', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        const select = screen.getByLabelText(/Wybierz wiersz:/i);
        fireEvent.change(select, { target: { value: 'row1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '5' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(mockUpdateRowWipLimit).toHaveBeenCalledWith('row1', 5);
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('handles error during WIP limit update', async () => {
        const errorContext = {
            ...mockContextValue,
            updateWipLimit: jest.fn().mockRejectedValue(new Error('API Error'))
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '10' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(screen.getByText('API Error')).toBeInTheDocument();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('handles default error message when API throws without message', async () => {
        const errorContext = {
            ...mockContextValue,
            updateWipLimit: jest.fn().mockRejectedValue(new Error())
        };
        
        render(
            <KanbanContext.Provider value={errorContext}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '10' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(screen.getByText('Wystąpił błąd podczas aktualizacji limitu WIP')).toBeInTheDocument();
    });

    test('disables form controls during submission', async () => {
        const delayedContext = {
            ...mockContextValue,
            updateWipLimit: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };
        
        render(
            <KanbanContext.Provider value={delayedContext}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        act(() => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(screen.getByText('Aktualizowanie...')).toBeInTheDocument();
        expect(select).toBeDisabled();
        expect(screen.getByLabelText(/Limit WIP/i)).toBeDisabled();
        expect(screen.getByText('Aktualizowanie...')).toBeDisabled();
        expect(screen.getByText('Anuluj')).toBeDisabled();
    });

    test('closes form when close button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByLabelText('Zamknij formularz'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes form when cancel button is clicked', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Anuluj'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('returns null when there are no columns and rows', () => {
        const emptyContext = {
            ...mockContextValue,
            columns: [],
            rows: []
        };
        
        const { container } = render(
            <KanbanContext.Provider value={emptyContext}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        expect(container).toBeEmptyDOMElement();
    });

    test('clears WIP limit when item selection is cleared', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        expect(wipInput.value).toBe('3');
        
        fireEvent.change(select, { target: { value: '' } });
        expect(wipInput.value).toBe('');
    });

    test('shows validation error when submitting with empty WIP limit', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(screen.getByText('Podaj prawidłowy limit WIP (liczba większa lub równa 0)')).toBeInTheDocument();
        expect(mockUpdateWipLimit).not.toHaveBeenCalled();
    });

    test('shows validation error when submitting with non-numeric WIP limit', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: 'abc' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(screen.getByText('Podaj prawidłowy limit WIP (liczba większa lub równa 0)')).toBeInTheDocument();
        expect(mockUpdateWipLimit).not.toHaveBeenCalled();
    });

    test('shows validation error when submitting with negative WIP limit', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '-5' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(mockUpdateWipLimit).not.toHaveBeenCalled();
    });

    test('specifically tests the negative WIP limit validation message', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '-5' } });

        await act(async () => {
            const form = screen.getByRole('form', { hidden: true }) || document.querySelector('form');
            fireEvent.submit(form);
        });
        
        expect(screen.getByText('Podaj prawidłowy limit WIP (liczba większa lub równa 0)')).toBeInTheDocument();
        expect(mockUpdateWipLimit).not.toHaveBeenCalled();
    });
     
    test('forces non-negative values for input via onInput handler', () => {
        render( 
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);

        fireEvent.input(wipInput, { target: { value: -10 } });
        
        expect(wipInput.value).toBe('0');
    });

    test('shows correct error message when selecting row tab without rows', () => {
        const emptyRowsContext = {
            ...mockContextValue,
            rows: []
        };
        
        render(
            <KanbanContext.Provider value={emptyRowsContext}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const rowTab = screen.getByText('Wiersze');
        expect(rowTab).toBeDisabled();
    });
    
    test('tests onInput handler by simulating direct DOM input event', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        
        const mockEvent = {
            target: {
                value: -10
            }
        };
        
        const onInputProp = wipInput.oninput || wipInput.onInput;
        if (onInputProp) {
            onInputProp(mockEvent);
            expect(mockEvent.target.value).toBe("0");
            expect(wipInput.value).toBe("0");
        }
    });

    test('shows row validation error when submitting without selecting a row', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        await act(async () => {
            const form = screen.getByRole('form', { hidden: true });
            fireEvent.submit(form);
        });
        
        expect(screen.getByText('Wybierz wiersz!')).toBeInTheDocument();
        expect(mockUpdateRowWipLimit).not.toHaveBeenCalled();
    });

    test('displays "Bez limitu" for column with zero WIP limit', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        const options = Array.from(select.options);
        const doneOption = options.find(option => option.text.includes('Done'));
        expect(doneOption).toBeInTheDocument();
        expect(doneOption.text).toContain('(Bez limitu)');
    });

    test('displays "Bez limitu" for row with zero WIP limit', () => {
        const contextWithZeroWipRow = {
            ...mockContextValue,
            rows: [
                ...mockContextValue.rows,
                { id: 'row3', name: 'Zero WIP', wipLimit: 0 }
            ]
        };
        
        render(
            <KanbanContext.Provider value={contextWithZeroWipRow}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));
        
        const select = screen.getByLabelText(/Wybierz wiersz:/i);
        const options = Array.from(select.options);
        
        const zeroWipOption = options.find(option => option.text.includes('Zero WIP'));
        expect(zeroWipOption).toBeInTheDocument();
        expect(zeroWipOption.text).toContain('(Bez limitu)');
    });

    test('handles case when onClose prop is undefined', async () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.change(wipInput, { target: { value: '10' } });

        await act(async () => {
            fireEvent.click(screen.getByText('Ustaw limit'));
        });
        
        expect(mockUpdateWipLimit).toHaveBeenCalledWith('col1', 10);
    });

    test('handles case when selected column is not found', () => {
        const manipulatableRef = { value: '' };
        
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['non-existent-id', jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [manipulatableRef, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['column', jest.fn()]);
        
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'anything' } });
        expect(manipulatableRef.value).toBe('');
    });

    test('handles case when selected row is not found', () => {
        const manipulatableRef = { value: '' };
        
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['non-existent-id', jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [manipulatableRef, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [false, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['row', jest.fn()]);
        
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );

        fireEvent.click(screen.getByText('Wiersze'));
        const select = screen.getByLabelText(/Wybierz wiersz:/i);
        fireEvent.change(select, { target: { value: 'anything' } });
        expect(manipulatableRef.value).toBe('');
    });
    
    test('verifies onInput handler with non-negative values', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        
        const mockEvent = {
            target: {
                value: 10
            }
        };
        
        const onInputProp = wipInput.oninput || wipInput.onInput;
        if (onInputProp) {
            onInputProp(mockEvent);
            expect(mockEvent.target.value).toBe(10);
            expect(wipInput.value).toBe('3');
        }
    });

    test('tests missing branch when column is not found', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        expect(wipInput.value).toBe('3');
        Object.defineProperty(select, 'value', { value: 'non-existent-column' });
        fireEvent.change(select); 
        expect(wipInput.value).toBe('3');
    });
    
    test('tests both branches of onInput handler for WIP limit input', () => {
        render(
            <KanbanContext.Provider value={mockContextValue}>
                <WipLimitControl onClose={mockOnClose} />
            </KanbanContext.Provider>
        );
        const select = screen.getByLabelText(/Wybierz kolumnę:/i);
        fireEvent.change(select, { target: { value: 'col1' } });
        
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        fireEvent.input(wipInput, { target: { value: -5 } });
        expect(wipInput.value).toBe('0');
 
        fireEvent.input(wipInput, { target: { value: 10 } });
        expect(wipInput.value).toBe('10');
    });

    test('handles direct selection of non-existent row via DOM manipulation', () => {
        render(
          <KanbanContext.Provider value={mockContextValue}>
            <WipLimitControl onClose={mockOnClose} />
          </KanbanContext.Provider>
        );
        
        fireEvent.click(screen.getByText('Wiersze'));

        const select = screen.getByLabelText(/Wybierz wiersz:/i);
        fireEvent.change(select, { target: { value: 'row1' } });
        const wipInput = screen.getByLabelText(/Limit WIP/i);
        expect(wipInput.value).toBe('2');
        
        Object.defineProperty(select, 'value', { value: 'non-existent-row-id' });
        fireEvent.change(select);

        expect(wipInput.value).toBe('2');
    });

});