import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditableText from '../../components/EditableText';

describe('EditableText Component', () => {
    const mockOnUpdate = jest.fn().mockResolvedValue(true);
    
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('renders text correctly in default view mode', () => {
        render(
            <EditableText
                id="test-1"
                text="Test Text"
                onUpdate={mockOnUpdate}
                type="task"
            />
        );
        
        const textElement = screen.getByText('Test Text');
        expect(textElement).toBeInTheDocument();
        expect(textElement).toHaveClass('editable-text');
        expect(textElement).toHaveAttribute('data-type', 'task');
    });
    
    test('switches to edit mode on double click', () => {
        render(
            <EditableText
                id="test-1"
                text="Test Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        const textElement = screen.getByText('Test Text');
        fireEvent.doubleClick(textElement);
        
        const inputElement = screen.getByDisplayValue('Test Text');
        expect(inputElement).toBeInTheDocument();
        expect(inputElement).toHaveClass('editable-text-input');
        expect(document.activeElement).toBe(inputElement);
    });
    
    test('calls onUpdate when input is valid and blurred', async () => {
        render(
            <EditableText
                id="test-1"
                text="Original Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        fireEvent.doubleClick(screen.getByText('Original Text')); 
        const inputElement = screen.getByDisplayValue('Original Text');
        fireEvent.change(inputElement, { target: { value: 'Updated Text' } });
        await act(async () => {
            fireEvent.blur(inputElement);
        });
        
        expect(mockOnUpdate).toHaveBeenCalledWith('test-1', 'Updated Text', 'default');
        
        expect(screen.getByText('Original Text')).toBeInTheDocument();
    });
    
    test('does not update when input is empty', async () => {
        render(
            <EditableText
                id="test-1"
                text="Original Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        fireEvent.doubleClick(screen.getByText('Original Text'));
        
        const inputElement = screen.getByDisplayValue('Original Text');
        fireEvent.change(inputElement, { target: { value: '   ' } });
        await act(async () => {
            fireEvent.blur(inputElement);
        });
        
        expect(mockOnUpdate).not.toHaveBeenCalled();
        
        expect(screen.getByText('Original Text')).toBeInTheDocument();
    });
    
    test('cancels editing when Escape key is pressed', () => {
        render(
            <EditableText
                id="test-1"
                text="Original Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        fireEvent.doubleClick(screen.getByText('Original Text'));
        const inputElement = screen.getByDisplayValue('Original Text');
        fireEvent.change(inputElement, { target: { value: 'Changed Text' } });
        fireEvent.keyDown(inputElement, { key: 'Escape' });
        
        expect(mockOnUpdate).not.toHaveBeenCalled();
        
        expect(screen.getByText('Original Text')).toBeInTheDocument();
    });
    
    test('calls onUpdate when Enter key is pressed', async () => {
        render(
            <EditableText
                id="test-1"
                text="Original Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        fireEvent.doubleClick(screen.getByText('Original Text'));
        const inputElement = screen.getByDisplayValue('Original Text');
        fireEvent.change(inputElement, { target: { value: 'Updated Text' } });
        
        await act(async () => {
            fireEvent.keyDown(inputElement, { key: 'Enter' });
        });
        
        expect(mockOnUpdate).toHaveBeenCalledWith('test-1', 'Updated Text', 'default');
        expect(screen.getByText('Original Text')).toBeInTheDocument();
    });
    
    test('simulates updating text from parent when onUpdate succeeds', async () => {
        const { rerender } = render(
            <EditableText
                id="test-1"
                text="Original Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        fireEvent.doubleClick(screen.getByText('Original Text'));
        const inputElement = screen.getByDisplayValue('Original Text');
        fireEvent.change(inputElement, { target: { value: 'Updated Text' } });
        
        await act(async () => {
            fireEvent.blur(inputElement);
        });
        
        rerender(
            <EditableText
                id="test-1"
                text="Updated Text"
                onUpdate={mockOnUpdate}
            />
        );
        
        expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
    
    test('applies custom classNames correctly', () => {
        render(
            <EditableText
                id="test-1"
                text="Test Text"
                onUpdate={mockOnUpdate}
                className="custom-class"
                inputClassName="custom-input-class"
            />
        );
        
        const textElement = screen.getByText('Test Text');
        expect(textElement).toHaveClass('editable-text');
        expect(textElement).toHaveClass('custom-class');
        fireEvent.doubleClick(textElement);
        const inputElement = screen.getByDisplayValue('Test Text');
        expect(inputElement).toHaveClass('editable-text-input');
        expect(inputElement).toHaveClass('custom-input-class');
    });
});