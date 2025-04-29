import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskDetails from '../../components/TaskDetails';
import * as api from '../../services/api';
import { KanbanProvider } from '../../context/KanbanContext';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

jest.mock('../../services/api');

describe('TaskDetails Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'This is a test task description',
    columnId: 'col1',
    rowId: 'row1',
    labels: ['Bug', 'Frontend']
  };
  
  const mockSubtasks = [
    { id: 1, title: 'Subtask 1', completed: false, description: 'First subtask details' },
    { id: 2, title: 'Subtask 2', completed: true, description: 'Second subtask details' }
  ];
  
  const mockAssignedUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 3, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 3, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  
  const onCloseMock = jest.fn();
  const onSubtaskUpdateMock = jest.fn();
  const refreshTasksMock = jest.fn();
  
  const mockContextValue = {
    refreshTasks: refreshTasksMock
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.fetchTask.mockResolvedValue({ 
      ...mockTask,
      description: mockTask.description 
    });
    api.fetchUsers.mockResolvedValue(mockUsers);
    api.fetchSubTasksByTaskId.mockResolvedValue(mockSubtasks);
    api.getUserAvatar.mockResolvedValue('avatar-url.jpg');
    api.updateTask.mockResolvedValue({ success: true });
    api.toggleSubTaskCompletion.mockResolvedValue({ success: true });
    api.addSubTask.mockResolvedValue({ id: 3, title: 'New Subtask', completed: false });
    api.deleteSubTask.mockResolvedValue({ success: true });
    api.updateSubTask.mockResolvedValue({ success: true });
    api.assignUserToTask.mockResolvedValue({ success: true });
    api.removeUserFromTask.mockResolvedValue({ success: true });
    api.fetchSubTask.mockResolvedValue({ id: 1, description: 'Detailed description' });
    
    global.fetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAssignedUsers)
      })
    );
    
    jest.useFakeTimers();
    
    console.error = jest.fn();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  const renderTaskDetails = () => {
    return render(
      <KanbanProvider value={mockContextValue}>
        <TaskDetails 
          task={mockTask} 
          onClose={onCloseMock} 
          onSubtaskUpdate={onSubtaskUpdateMock} 
        />
      </KanbanProvider>
    );
  };

  test('renders loading state initially', () => {
    renderTaskDetails({ onClose: onCloseMock });
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
    expect(screen.getByText('Ładowanie...').closest('.task-details-panel')).toHaveClass('loading');
  });

  test('loads and displays task data correctly', async () => {
    api.fetchTask.mockResolvedValue({
      ...mockTask,
      labels: ['Bug', 'Frontend']
    });
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(api.fetchTask).toHaveBeenCalledWith(mockTask.id);
      expect(api.fetchSubTasksByTaskId).toHaveBeenCalledWith(mockTask.id);
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
    expect(screen.getByText('Subtask 1')).toBeInTheDocument();
    expect(screen.getByText('Subtask 2')).toBeInTheDocument();
    expect(screen.getByText('Etykiety')).toBeInTheDocument();
    expect(screen.getByText('+ Etykieta')).toBeInTheDocument();
  });

  test('handles error when loading task data', async () => {
    api.fetchTask.mockRejectedValueOnce(new Error('Failed to load task'));
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(api.fetchTask).toHaveBeenCalledWith(mockTask.id);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading task data:',
        expect.any(Error)
      );
    });
  });

  test('allows editing task description', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const editButton = await screen.findByTitle('Edytuj opis zadania');
    fireEvent.click(editButton);
    
    const textarea = screen.getByPlaceholderText('Wprowadź opis zadania');
    fireEvent.change(textarea, { target: { value: 'Updated description' } });
    fireEvent.click(screen.getByText('Zapisz'));
    
    expect(api.updateTask).toHaveBeenCalledWith(mockTask.id, { 
      description: 'Updated description' 
    });
    
    await waitFor(() => {
      expect(screen.getByText('Operacja zakończona pomyślnie!')).toBeInTheDocument();
    });
    
    act(() => {
      jest.advanceTimersByTime(3100);
    });
    
    expect(screen.queryByText('Operacja zakończona pomyślnie!')).not.toBeInTheDocument();
  });

  test('allows canceling task description editing', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const editButton = await screen.findByTitle('Edytuj opis zadania');
    fireEvent.click(editButton);
    const textarea = screen.getByPlaceholderText('Wprowadź opis zadania');
    fireEvent.change(textarea, { target: { value: 'This should be discarded' } });
    fireEvent.click(screen.getByText('Anuluj'));
    
    expect(api.updateTask).not.toHaveBeenCalled();
    expect(screen.getByText(mockTask.description)).toBeInTheDocument();
  });

  test('allows adding a new subtask', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
  });
    
  test('allows adding a new subtask', async () => {
    renderTaskDetails();
        
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
        
    const input = await screen.findByPlaceholderText('Nazwa podzadania');
    fireEvent.change(input, { target: { value: 'New Subtask' } });
        
    const addButton = screen.getByText('Dodaj');
    api.addSubTask.mockResolvedValue({ id: 3, title: 'New Subtask', completed: false });
        
    await act(async () => {
      fireEvent.click(addButton);
    });
        
    await waitFor(() => {
      expect(api.addSubTask).toHaveBeenCalledWith(mockTask.id, 'New Subtask');
    });
    expect(onSubtaskUpdateMock).toHaveBeenCalled();
    expect(screen.getByText('Operacja zakończona pomyślnie!')).toBeInTheDocument();
  });

  test('prevents adding empty subtasks', async () => {
    renderTaskDetails();
        
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });

    const input = await screen.findByPlaceholderText('Nazwa podzadania');
    fireEvent.change(input, { target: { value: '   ' } });
        
    const addButton = screen.getByText('Dodaj');
    fireEvent.click(addButton);
    expect(api.addSubTask).not.toHaveBeenCalled();
  });

  test('allows toggling subtask completion', async () => {
    api.toggleSubTaskCompletion.mockResolvedValue({ 
      id: mockSubtasks[0].id,
      title: mockSubtasks[0].title,
      completed: !mockSubtasks[0].completed
    });
  
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    const checkbox = await screen.findByLabelText('Subtask 1');
    
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(api.toggleSubTaskCompletion).toHaveBeenCalledWith(mockSubtasks[0].id);
    });
    
    expect(onSubtaskUpdateMock).toHaveBeenCalled();
  });

  test('allows expanding and viewing subtask details', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const expandButtons = await screen.findAllByTitle('Pokaż opis');
    fireEvent.click(expandButtons[0]);
    
    expect(api.fetchSubTask).toHaveBeenCalledWith(mockSubtasks[0].id);
    
    await waitFor(() => {
      expect(screen.getByText('Detailed description')).toBeInTheDocument();
    });
  });

  test('allows editing subtask description', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const expandButtons = await screen.findAllByTitle('Pokaż opis');
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Detailed description')).toBeInTheDocument();
    });
    
    const editDescButton = await screen.findByTitle('Edytuj opis');
    fireEvent.click(editDescButton);
    const textarea = screen.getByPlaceholderText('Wprowadź opis podzadania');
    fireEvent.change(textarea, { target: { value: 'Updated subtask description' } });
    
    await waitFor(() => {
      const saveButtons = screen.getAllByText('Zapisz');
      expect(saveButtons.length).toBeGreaterThan(0);
      fireEvent.click(saveButtons[saveButtons.length - 1]);
    });
    
    expect(api.updateSubTask).toHaveBeenCalledWith(mockSubtasks[0].id, { 
      description: 'Updated subtask description' 
    });
  });

  test('handles subtask deletion with confirmation', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/)).toBeInTheDocument();
    });
    
    api.deleteSubTask.mockResolvedValue({ success: true });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Tak'));
    });
    
    await waitFor(() => {
      expect(api.deleteSubTask).toHaveBeenCalledWith(mockSubtasks[0].id);
      expect(onSubtaskUpdateMock).toHaveBeenCalled();
    });
  });

  test('allows canceling subtask deletion', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]); 
    
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Nie'));
    
    expect(api.deleteSubTask).not.toHaveBeenCalled();
    expect(screen.queryByText(/Czy na pewno chcesz usunąć podzadanie:/)).not.toBeInTheDocument();
  });

  test('allows assigning users to the task', async () => {
    jest.clearAllMocks();
    
    api.assignUserToTask.mockImplementation(() => Promise.resolve({ success: true }));
    api.getUserAvatar.mockImplementation(() => Promise.resolve('avatar-url.jpg'));
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = await screen.findByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);
    
    await waitFor(() => {
      expect(screen.getByText('Wybierz użytkownika')).toBeInTheDocument();
    });
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });
    
    const submitButton = screen.getByText('Przypisz');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.assignUserToTask).toHaveBeenCalledWith(mockTask.id, 2);
    });
  });

  test('prevents assigning without selecting a user', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = await screen.findByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);
    
    const submitButton = screen.getByText('Przypisz');
    fireEvent.click(submitButton);
    
    expect(api.assignUserToTask).not.toHaveBeenCalled();
  });

  test('allows canceling user removal', async () => {
    api.fetchTask.mockResolvedValue({
      ...mockTask,
      userIds: [1, 3] 
    });
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Przypisani:')).toBeInTheDocument();
    });
    
    const removeButtons = await screen.findAllByTitle('Usuń użytkownika');
    fireEvent.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć użytkownika:/)).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Nie'));
    
    expect(api.removeUserFromTask).not.toHaveBeenCalled();
  });

  test('updates task labels', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const updateTaskSpy = jest.spyOn(api, 'updateTask');
    const newLabels = ['Bug', 'Frontend', 'High Priority'];
    
    const labelsSection = await screen.findByText('Etykiety');
    
    await act(async () => {
      mockContextValue.refreshTasks(newLabels);
      await api.updateTask(mockTask.id, { labels: newLabels });
    });
    
    expect(updateTaskSpy).toHaveBeenCalledWith(mockTask.id, { 
      labels: expect.any(Array)
    });
  });

  test('handles closing the task details panel', async () => {
   renderTaskDetails();
  
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
  
    const closeButton = screen.getByText('×', { selector: '.close-panel-btn' });
    fireEvent.click(closeButton);
  
    expect(onCloseMock).toHaveBeenCalled();
  });

  test('handles click outside to close panel', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const overlay = document.querySelector('.task-details-overlay');
    fireEvent.click(overlay);
    
    expect(onCloseMock).toHaveBeenCalled();
  });

  test('handles error when loading subtasks', async () => {
    api.fetchSubTasksByTaskId.mockRejectedValueOnce(new Error('Failed to load subtasks'));
  
    renderTaskDetails();
  
    await waitFor(() => {
      expect(api.fetchSubTasksByTaskId).toHaveBeenCalledWith(mockTask.id);
      expect(console.error).toHaveBeenCalledWith(
        'Error loading task data:',
        expect.any(Error)
      );
    });
  });

  test('handles error when updating subtask description', async () => {
    api.updateSubTask.mockRejectedValueOnce(new Error('Failed to update subtask'));
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const expandButtons = await screen.findAllByTitle('Pokaż opis');
    fireEvent.click(expandButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Detailed description')).toBeInTheDocument();
    });
    
    const editDescButton = await screen.findByTitle('Edytuj opis');
    fireEvent.click(editDescButton);
    
    const textarea = screen.getByPlaceholderText('Wprowadź opis podzadania');
    fireEvent.change(textarea, { target: { value: 'Updated description' } });
    
    const saveButton = screen.getByText('Zapisz');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.updateSubTask).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving subtask description:',
        expect.any(Error)
      );
    });
  });

  test('handles error when adding a new subtask', async () => {
    api.addSubTask.mockRejectedValueOnce(new Error('Failed to add subtask'));
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const subtaskInput = screen.getByPlaceholderText('Nazwa podzadania');
    fireEvent.change(subtaskInput, { target: { value: 'New subtask' } });
    
    const submitButton = screen.getByText('Dodaj');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.addSubTask).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error adding subtask:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas dodawania podzadania');
    });
  });

  test('handles error when deleting a subtask', async () => {
    api.deleteSubTask.mockRejectedValueOnce(new Error('Failed to delete subtask'));
  
    renderTaskDetails();
  
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
  
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]);
  
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/)).toBeInTheDocument();
    });
  
    const confirmButton = screen.getByText('Tak');
    fireEvent.click(confirmButton);
  
    await waitFor(() => {
      expect(api.deleteSubTask).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting subtask:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas usuwania podzadania');
    });
  });

  test('handles error when assigning a user to task', async () => {
    api.assignUserToTask.mockRejectedValueOnce(new Error('Failed to assign user'));
    console.error = jest.fn();
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = screen.getByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByText('Wybierz użytkownika')).toBeInTheDocument();
    });
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    const assignSubmitButton = screen.getByText('Przypisz');
    await act(async () => {
      fireEvent.click(assignSubmitButton);
    });

    await waitFor(() => {
      expect(api.assignUserToTask).toHaveBeenCalledWith(mockTask.id, 2);
      expect(console.error).toHaveBeenCalledWith(
        'Error assigning user:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas przypisywania użytkownika');
    });
  });

  test('handles error when trying to assign a user already assigned to the task', async () => {
    api.assignUserToTask.mockRejectedValueOnce({
      response: {
        data: { message: 'User is already assigned to this task' }
      }
    });
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = screen.getByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);
    
    const userSelect = screen.getByRole('combobox');
    fireEvent.change(userSelect, { target: { value: '2' } });
    
    const confirmButton = screen.getByText('Przypisz');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Wystąpił błąd podczas przypisywania użytkownika');
    });
        
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  test('handles removing a user from task', async () => {
    api.removeUserFromTask.mockResolvedValue({ success: true });
    
    // Add this line to include userIds in the mock task
    api.fetchTask.mockResolvedValue({
      ...mockTask,
      userIds: [1, 3] // IDs corresponding to the mockAssignedUsers
    });
    
    global.fetch = jest.fn().mockImplementation((url) => {
      // Keep your existing implementation
    });
  
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Przypisani:')).toBeInTheDocument();
    });
    
    const removeButtons = await screen.findAllByTitle('Usuń użytkownika');
    expect(removeButtons.length).toBeGreaterThan(0);
    
    await act(async () => {
      fireEvent.click(removeButtons[0]);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć użytkownika:/)).toBeInTheDocument();
    });
    
    await act(async () => {
      fireEvent.click(screen.getByText('Tak'));
    });
    
    await waitFor(() => {
      expect(api.removeUserFromTask).toHaveBeenCalled();
    });
  });
  
  test('handles error when deleting a subtask', async () => {
    api.deleteSubTask.mockRejectedValueOnce(new Error('Failed to delete subtask'));
  
    renderTaskDetails();
  
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
  
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]);
  
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/)).toBeInTheDocument();
    });
  
    const confirmButton = screen.getByText('Tak');
    fireEvent.click(confirmButton);
  
    await waitFor(() => {
      expect(api.deleteSubTask).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting subtask:',
        expect.any(Error)
      );
  });
  });
  
  test('handles click outside subtask delete confirmation to cancel', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/)).toBeInTheDocument();
    });
    
    const overlay = screen.getByText(/Czy na pewno chcesz usunąć podzadanie:/).closest('.delete-confirmation-overlay');
    fireEvent.click(overlay);
    
    await waitFor(() => {
      expect(screen.queryByText(/Czy na pewno chcesz usunąć podzadanie:/)).not.toBeInTheDocument();
    });
    
    expect(api.deleteSubTask).not.toHaveBeenCalled();
  });
  
  test('handles subtask delete confirmation cancel button', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const deleteButtons = await screen.findAllByTitle('Usuń podzadanie');
    fireEvent.click(deleteButtons[0]);
    
    const cancelButton = screen.getByText('Nie');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText('Usuń podzadanie')).not.toBeInTheDocument();
    
    expect(api.deleteSubTask).not.toHaveBeenCalled();
  });
  
  test('handles keyboard escape key to close modals', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = screen.getByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);
    expect(screen.getByText('Przypisz użytkownika')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
  
  test('allows viewing and collapsing subtask description', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const expandButtons = await screen.findAllByTitle('Pokaż opis');
    fireEvent.click(expandButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Detailed description')).toBeInTheDocument();
    });
    
    const collapseButton = screen.getByTitle('Ukryj opis');
    fireEvent.click(collapseButton);
    
    expect(screen.queryByText('Detailed description')).not.toBeInTheDocument();
  });
  
  test('handles notification dispatching for subtask updates', async () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    

    const checkbox = await screen.findByLabelText('Subtask 1');
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(api.toggleSubTaskCompletion).toHaveBeenCalled();
    });
    

    expect(dispatchEventSpy).toHaveBeenCalled();
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe('subtask-updated');
    

    dispatchEventSpy.mockRestore();
  });

  test('handles escape key press to close panel', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Czy na pewno chcesz usunąć/)).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalled();
  });

  test('focuses back on task description input after canceling edit', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const editButton = await screen.findByTitle('Edytuj opis zadania');
    fireEvent.click(editButton);
    fireEvent.click(screen.getByText('Anuluj'));
  
  });
  
  test('handles editing task description with empty value', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const editButton = await screen.findByTitle('Edytuj opis zadania');
    fireEvent.click(editButton);
    const textarea = screen.getByPlaceholderText('Wprowadź opis zadania');
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByText('Zapisz'));
    
    await waitFor(() => {
      expect(api.updateTask).toHaveBeenCalledWith(
        mockTask.id, 
        { description: '' }
      );
    });
  });
  
  test('handles user assignment dropdown closing without selection', async () => {
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const assignButton = screen.getByTitle('Przypisz użytkownika');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByText('Wybierz użytkownika')).toBeInTheDocument();
    });
    
    const dropdownHeader = screen.getByText('Przypisz użytkownika').closest('.dropdown-header');
    const closeButton = within(dropdownHeader).getByText('×');
    fireEvent.click(closeButton);

    expect(api.assignUserToTask).not.toHaveBeenCalled();
  });

  test('renders and interacts with empty description placeholder', async () => {
    api.fetchTask.mockResolvedValueOnce({ 
      ...mockTask,
      description: '' 
    });
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Brak opisu. Kliknij ikonę edycji, aby dodać opis.')).toBeInTheDocument();    
    const editButton = await screen.findByTitle('Edytuj opis zadania');
    fireEvent.click(editButton);
    const textarea = screen.getByPlaceholderText('Wprowadź opis zadania');
    fireEvent.change(textarea, { target: { value: 'New description content' } });
    fireEvent.click(screen.getByText('Zapisz'));
    
    await waitFor(() => {
      expect(api.updateTask).toHaveBeenCalledWith(
        mockTask.id, 
        { description: 'New description content' }
      );
    });
  });
  
  test('handles assigned user avatar loading errors', async () => {
    api.fetchTask.mockResolvedValueOnce({ 
      ...mockTask,
      userIds: [1, 3]
    });
    
    api.getUserAvatar
      .mockRejectedValueOnce(new Error("Failed to load avatar"))
      .mockResolvedValueOnce('avatar-url.jpg');
    
    renderTaskDetails();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('Przypisani:')).toBeInTheDocument();
    });
    
    const avatarList = document.querySelector('.avatar-list');
    expect(avatarList).toBeInTheDocument();
    
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching user avatar:',
      expect.any(Error)
    );
  });
  
  test('handles subtask checkbox interaction edge cases', async () => {
    api.toggleSubTaskCompletion
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ 
        id: mockSubtasks[0].id,
        title: mockSubtasks[0].title,
        completed: true
      });
    renderTaskDetails();
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    const checkbox = await screen.findByLabelText('Subtask 1');
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error toggling subtask completion:',
        expect.any(Error)
      );
    });
    
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(api.toggleSubTaskCompletion).toHaveBeenCalledTimes(2);
    });
  });

});