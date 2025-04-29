import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TaskLabels from '../../components/TaskLabels';
import { addLabelToTask, removeLabelFromTask, getAllLabels } from '../../services/api';
import KanbanContext from '../../context/KanbanContext';
import { toast } from 'react-toastify';

jest.mock('../../services/api', () => ({
  addLabelToTask: jest.fn(),
  removeLabelFromTask: jest.fn(),
  getAllLabels: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
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
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
      },
      writable: true
    });
    
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
      expect(screen.getByText('Predefiniowane etykiety')).toBeInTheDocument();
    });
  });
  
  test('adds a predefined label when selected', async () => {
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    const highPriorityOption = screen.getByText('High Priority');
    await act(async () => {
      fireEvent.click(highPriorityOption);
    });

    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'High Priority');
      expect(mockLabelsChange).toHaveBeenCalledWith([...initialLabels, 'High Priority']);
      expect(mockRefreshTasks).toHaveBeenCalled();
    });
  });
  
  test('removes a label when remove button is clicked', async () => {
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
    
    const bugLabel = screen.getAllByText('×')[0];
    await act(async () => {
      fireEvent.click(bugLabel);
    });
    
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    const customLabelOption = screen.getByText('Dodaj własną etykietę');
    await act(async () => {
      fireEvent.click(customLabelOption);
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Wpisz nazwę etykiety')).toBeInTheDocument();
      expect(screen.getByText('Kolor etykiety:')).toBeInTheDocument();
    });
  });
  
  test('adds a custom label when submitted', async () => {
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      const customLabelOption = screen.getByText('Dodaj własną etykietę');
      fireEvent.click(customLabelOption);
    });
    
    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Wpisz nazwę etykiety');
      const colorInput = screen.getByDisplayValue('#888888');
      
      fireEvent.change(nameInput, { target: { value: 'Custom Label' } });
      fireEvent.change(colorInput, { target: { value: '#FF00FF' } });
      
      const submitButton = screen.getByText('Dodaj');
      fireEvent.click(submitButton);
    });
    
    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'Custom Label');
      expect(mockLabelsChange).toHaveBeenCalledWith([...initialLabels, 'Custom Label']);
      expect(mockRefreshTasks).toHaveBeenCalled();
    });
    
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      const customLabelOption = screen.getByText('Dodaj własną etykietę');
      fireEvent.click(customLabelOption);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Dodaj własną etykietę')).toBeInTheDocument();
      const cancelButton = screen.getByText('Anuluj');
      fireEvent.click(cancelButton);
    });
    
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Wybierz etykietę')).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Wybierz etykietę')).not.toBeInTheDocument();
    });
  });
  
  test('loads label colors from localStorage', async () => {
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
    
    expect(window.localStorage.getItem).toHaveBeenCalledWith('labelColors');
  });
  
  test('prevents adding duplicate labels', async () => {
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const bugOption = screen.getAllByText('Bug')[1];
      fireEvent.click(bugOption);
    });
    
    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith('Ta etykieta została już dodana do zadania');
      expect(addLabelToTask).not.toHaveBeenCalled();
    });
  });
  
  test('handles API errors gracefully when adding labels', async () => {
    addLabelToTask.mockRejectedValue(new Error('API error'));
    console.error = jest.fn();
    
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
    
    const addButton = screen.getByText('+ Etykieta');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    await waitFor(() => {
      const highPriorityOption = screen.getByText('High Priority');
      fireEvent.click(highPriorityOption);
    });

    await waitFor(() => {
      expect(addLabelToTask).toHaveBeenCalledWith(1, 'High Priority');
      expect(console.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas dodawania etykiety');
    });
  });
  
  test('handles API errors gracefully when removing labels', async () => {
    removeLabelFromTask.mockRejectedValue(new Error('API error'));
    console.error = jest.fn();
    
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
    
    const bugLabel = screen.getAllByText('×')[0];
    await act(async () => {
      fireEvent.click(bugLabel);
    });
    
    await waitFor(() => {
      expect(removeLabelFromTask).toHaveBeenCalledWith(1, 'Bug');
      expect(console.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas usuwania etykiety');
    });
  });

});