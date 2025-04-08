import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TaskLabels from '../../components/TaskLabels';
import { addLabelToTask, removeLabelFromTask, getAllLabels } from '../../services/api';
import KanbanContext from '../../context/KanbanContext';

jest.mock('../../services/api', () => ({
  addLabelToTask: jest.fn(),
  removeLabelFromTask: jest.fn(),
  getAllLabels: jest.fn()
}));

jest.mock('react-dom', () => {
  const original = jest.requireActual('react-dom');
  return {
    ...original,
    createPortal: (node) => node,
  };
});

describe('TaskLabels Component', () => {
  const mockRefreshTasks = jest.fn();
  const mockLabelsChange = jest.fn();
  
  const mockContextValue = {
    refreshTasks: mockRefreshTasks
  };
  
  const initialLabels = ['Bug', 'Feature'];
  const allLabels = ['Bug', 'Feature', 'Documentation', 'High Priority', 'Medium Priority'];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
      },
      writable: true
    });
    
    // Mock getAllLabels response
    getAllLabels.mockResolvedValue(allLabels);
  });
  
  test('renders labels correctly', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    await waitFor(() => {
      expect(getAllLabels).toHaveBeenCalled();
    });
    
    initialLabels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    
    // Check that the "Add Label" button is present
    expect(screen.getByText('+ Etykieta')).toBeInTheDocument();
  });
  
  test('opens label picker when add button is clicked', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Click the add label button
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Check that the picker is shown
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
      expect(screen.getByText('Predefiniowane etykiety')).toBeInTheDocument();
    });
  });
  
  test('adds a predefined label when selected', async () => {
    // Setup API mock for adding a label
    addLabelToTask.mockResolvedValue({ id: 1, labels: [...initialLabels, 'High Priority'] });
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Click the add label button
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Wait for the picker to appear
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    // Click on "High Priority" label
    const highPriorityOption = screen.getByText('High Priority');
    await act(async () => {
      fireEvent.click(highPriorityOption);
    });
    
    // Check if API was called correctly
    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'High Priority');
      expect(mockLabelsChange).toHaveBeenCalledWith([...initialLabels, 'High Priority']);
      expect(mockRefreshTasks).toHaveBeenCalled();
    });
  });
  
  test('removes a label when remove button is clicked', async () => {
    // Setup API mock for removing a label
    removeLabelFromTask.mockResolvedValue({ id: 1, labels: ['Feature'] });
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Find the Bug label and its remove button (×)
    const bugLabel = screen.getAllByText('×')[0];
    await act(async () => {
      fireEvent.click(bugLabel);
    });
    
    // Check if API was called correctly
    await waitFor(() => {
      expect(removeLabelFromTask).toHaveBeenCalledWith(1, 'Bug');
      expect(mockLabelsChange).toHaveBeenCalledWith(['Feature']);
    });
  });
  
  test('opens custom label form when "Dodaj własną etykietę" is clicked', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Click the add label button
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Wait for the picker to appear
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    // Click on "Dodaj własną etykietę" option
    const customLabelOption = screen.getByText('Dodaj własną etykietę');
    await act(async () => {
      fireEvent.click(customLabelOption);
    });
    
    // Check if custom form appears
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Wpisz nazwę etykiety')).toBeInTheDocument();
      expect(screen.getByText('Kolor etykiety:')).toBeInTheDocument();
    });
  });
  
  test('adds a custom label when submitted', async () => {
    // Setup API mock for adding a label
    addLabelToTask.mockResolvedValue({ id: 1, labels: [...initialLabels, 'Custom Label'] });
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Open label picker
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Open custom label form
    await waitFor(() => {
      const customLabelOption = screen.getByText('Dodaj własną etykietę');
      fireEvent.click(customLabelOption);
    });
    
    // Fill in the form
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Wpisz nazwę etykiety');
      // Fix: query the color input directly by its type
      const colorInput = screen.getByDisplayValue('#888888');
      
      fireEvent.change(nameInput, { target: { value: 'Custom Label' } });
      fireEvent.change(colorInput, { target: { value: '#FF00FF' } });
      
      const submitButton = screen.getByText('Dodaj');
      fireEvent.click(submitButton);
    });
    
    // Check if API was called correctly
    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'Custom Label');
      expect(mockLabelsChange).toHaveBeenCalledWith([...initialLabels, 'Custom Label']);
      expect(mockRefreshTasks).toHaveBeenCalled();
    });
    
    // Check if custom color was stored in localStorage
    expect(window.localStorage.setItem).toHaveBeenCalled();
  });
  
  test('cancels custom label form when cancel button is clicked', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Open label picker
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Open custom label form
    await waitFor(() => {
      const customLabelOption = screen.getByText('Dodaj własną etykietę');
      fireEvent.click(customLabelOption);
    });
    
    // Verify form is open and click cancel
    await waitFor(() => {
      expect(screen.getByText('Dodaj własną etykietę')).toBeInTheDocument();
      const cancelButton = screen.getByText('Anuluj');
      fireEvent.click(cancelButton);
    });
    
    // Verify form is closed
    await waitFor(() => {
      expect(screen.queryByText('Dodaj własną etykietę')).not.toBeInTheDocument();
    });
  });
  
  test('closes label picker when clicking outside', async () => {
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Open label picker
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Verify picker is open
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    // Simulate click outside
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    
    // Verify picker is closed
    await waitFor(() => {
      expect(screen.queryByText('Wybierz etykietę')).not.toBeInTheDocument();
    });
  });
  
  test('loads label colors from localStorage', async () => {
    // Setup localStorage mock to return stored colors
    const storedColors = JSON.stringify({ 
      'Bug': '#FF0000', 
      'Feature': '#2196F3',
      'Custom': '#FFAA00' 
    });
    window.localStorage.getItem.mockReturnValue(storedColors);
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={[...initialLabels, 'Custom']} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Verify localStorage was checked
    expect(window.localStorage.getItem).toHaveBeenCalledWith('labelColors');
  });
  
  test('prevents adding duplicate labels', async () => {
    global.alert = jest.fn();
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Open label picker
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Click on "Bug" label (which is already in initialLabels)
    await waitFor(() => {
      const bugOption = screen.getAllByText('Bug')[1]; // Second "Bug" is in the picker
      fireEvent.click(bugOption);
    });
    
    // Check that alert was shown and API was not called
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Ta etykieta została już dodana do zadania');
      expect(addLabelToTask).not.toHaveBeenCalled();
    });
  });
  
  test('handles API errors gracefully when adding labels', async () => {
    // Setup API mock to throw an error
    addLabelToTask.mockRejectedValue(new Error('API error'));
    global.alert = jest.fn();
    global.console.error = jest.fn();
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Open label picker
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Click on "High Priority" label
    await waitFor(() => {
      const highPriorityOption = screen.getByText('High Priority');
      fireEvent.click(highPriorityOption);
    });
    
    // Check that error was handled
    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'High Priority');
      expect(console.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Wystąpił błąd podczas dodawania etykiety');
    });
  });
  
  test('handles API errors gracefully when removing labels', async () => {
    // Setup API mock to throw an error
    removeLabelFromTask.mockRejectedValue(new Error('API error'));
    global.alert = jest.fn();
    global.console.error = jest.fn();
    
    await act(async () => {
      render(
        <KanbanContext.Provider value={mockContextValue}>
          <TaskLabels 
            taskId={1} 
            initialLabels={initialLabels} 
            onLabelsChange={mockLabelsChange} 
          />
        </KanbanContext.Provider>
      );
    });
    
    // Find the Bug label and its remove button (×)
    const bugLabel = screen.getAllByText('×')[0];
    await act(async () => {
      fireEvent.click(bugLabel);
    });
    
    // Check that error was handled
    await waitFor(() => {
      expect(removeLabelFromTask).toHaveBeenCalledWith(1, 'Bug');
      expect(console.error).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Wystąpił błąd podczas usuwania etykiety');
    });
  });
});