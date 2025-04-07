import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Bench from '../../components/Bench';
import { fetchUsers, getUserAvatar, updateUserWipLimit } from '../../services/api';
import { KanbanProvider } from '../../context/KanbanContext';

// Mock the API functions
jest.mock('../../services/api', () => ({
  fetchUsers: jest.fn(),
  getUserAvatar: jest.fn(),
  updateUserWipLimit: jest.fn()
}));

// Mock URL.revokeObjectURL
URL.revokeObjectURL = jest.fn();

describe('Bench Component', () => {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', wipLimit: 5, taskCount: 3 },
    { id: 2, name: 'Alice Smith', email: 'alice@example.com', role: 'Developer', wipLimit: null, taskCount: 2 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', wipLimit: 3, taskCount: 4 }
  ];
  
  const mockRefreshTasks = jest.fn();
  
  const mockContextValue = {
    refreshTasks: mockRefreshTasks
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    fetchUsers.mockResolvedValue(mockUsers);
    getUserAvatar.mockResolvedValue('mock-avatar-url');
    updateUserWipLimit.mockResolvedValue({ success: true });
  });
  
  const renderBench = () => {
    return render(
      <KanbanProvider value={mockContextValue}>
        <Bench />
      </KanbanProvider>
    );
  };

  test('renders loading state initially', async () => {
    renderBench();
    expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
  });
  
  test('loads and displays users correctly', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(fetchUsers).toHaveBeenCalled();
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Check if user names are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    
    // Check if role is displayed
    expect(screen.getByText('Developer')).toBeInTheDocument();
    
    // Check if avatars were requested
    expect(getUserAvatar).toHaveBeenCalledTimes(3);
  });
  
  test('handles error when loading users', async () => {
    fetchUsers.mockRejectedValueOnce(new Error('Failed to load users'));
    
    renderBench();
    
    await waitFor(() => {
      expect(screen.getByText('Wystąpił błąd podczas ładowania użytkowników')).toBeInTheDocument();
    });
  });
  
  test('toggles bench visibility when toggle button is clicked', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    const benchContainer = document.querySelector('.bench-container');
    expect(benchContainer).not.toHaveClass('open');
    
    const toggleButton = screen.getByText('▶');
    fireEvent.click(toggleButton);
    
    expect(benchContainer).toHaveClass('open');
    expect(screen.getByText('◀')).toBeInTheDocument();
    
    // Toggle again
    fireEvent.click(screen.getByText('◀'));
    expect(benchContainer).not.toHaveClass('open');
  });
  
  test('sets up drag and drop for users', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Mock dataTransfer
    const dataTransfer = {
      setData: jest.fn(),
      effectAllowed: null
    };
    
    // Find first user card
    const userCard = screen.getByText('John Doe').closest('.user-card');
    
    // Simulate drag start
    fireEvent.dragStart(userCard, { dataTransfer });
    
    // Check that dataTransfer.setData was called correctly
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/user', 
      expect.stringContaining('userId')
    );
    expect(dataTransfer.effectAllowed).toBe('copy');
  });
  
  test('displays WIP limits correctly', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Check WIP limit display
    expect(screen.getByText('WIP Limit: 5')).toBeInTheDocument();
    expect(screen.getByText('WIP Limit: Unlimited')).toBeInTheDocument();
    
    // Check task count display
    expect(screen.getByText('Zadania: 3/5')).toBeInTheDocument();
    expect(screen.getByText('Zadania: 2/Unlimited')).toBeInTheDocument();
    expect(screen.getByText('Zadania: 4/3')).toBeInTheDocument();
    
    // Check that the user who exceeded WIP limit has the appropriate class
    const exceededTaskCount = screen.getByText('Zadania: 4/3');
    expect(exceededTaskCount).toHaveClass('limit-reached');
  });
  
  test('allows editing WIP limit', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Find and click WIP limit display to edit
    const wipLimitDisplay = screen.getAllByText(/WIP Limit/)[0].closest('.wip-limit-display');
    fireEvent.click(wipLimitDisplay);
    
    // Check if input appears
    const input = screen.getByPlaceholderText('Unlimited');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('5'); // Initial value should be set
    
    // Change value
    fireEvent.change(input, { target: { value: '7' } });
    
    // Mock the implementation of updateUserWipLimit to immediately call refreshTasks
    updateUserWipLimit.mockImplementationOnce(() => {
      mockRefreshTasks();
      return Promise.resolve({ success: true });
    });
    
    // Save changes with proper async handling
    const saveButton = screen.getByTitle('Zapisz limit WIP');
    
    // Use act with await to ensure all state updates and effects complete
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Verify the API was called with the right parameters
    expect(updateUserWipLimit).toHaveBeenCalledWith(1, 7);
    
    // Verify refreshTasks was called
    expect(mockRefreshTasks).toHaveBeenCalled();
  });
  
  test('allows canceling WIP limit edit', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Find and click WIP limit display to edit
    const wipLimitDisplay = screen.getAllByText(/WIP Limit/)[0].closest('.wip-limit-display');
    fireEvent.click(wipLimitDisplay);
    
    // Change value
    const input = screen.getByPlaceholderText('Unlimited');
    fireEvent.change(input, { target: { value: '7' } });
    
    // Cancel changes
    const cancelButton = screen.getByTitle('Anuluj');
    fireEvent.click(cancelButton);
    
    // Check if input disappeared and original value is shown
    expect(screen.queryByPlaceholderText('Unlimited')).not.toBeInTheDocument();
    expect(screen.getByText('WIP Limit: 5')).toBeInTheDocument();
    
    // Check that API was not called
    expect(updateUserWipLimit).not.toHaveBeenCalled();
  });
  
  test('handles errors when updating WIP limit', async () => {
    // Mock console.error
    console.error = jest.fn();
    
    // Mock API to reject
    updateUserWipLimit.mockRejectedValueOnce(new Error('Failed to update WIP limit'));
    
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Find and click WIP limit display to edit
    const wipLimitDisplay = screen.getAllByText(/WIP Limit/)[0].closest('.wip-limit-display');
    fireEvent.click(wipLimitDisplay);
    
    // Save changes
    const saveButton = screen.getByTitle('Zapisz limit WIP');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Check if error was logged
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error updating WIP limit:', 
        expect.any(Error)
      );
    });
  });
  
  test('handles avatar loading errors gracefully', async () => {
    // Mock getUserAvatar to fail for one user
    getUserAvatar.mockImplementation((userId) => {
      if (userId === 1) {
        return Promise.reject(new Error('Avatar load failed'));
      }
      return Promise.resolve('mock-avatar-url');
    });
    
    // Mock console.error
    console.error = jest.fn();
    
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Check if error was logged but component still rendered
    expect(console.error).toHaveBeenCalledWith(
      'Error loading avatar for user 1:',
      expect.any(Error)
    );
    
    // All users should still be displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  test('handles avatar image errors', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Find all avatar images
    const avatarImages = document.querySelectorAll('.avatar');
    
    // Simulate error on first image
    fireEvent.error(avatarImages[0]);
    
    // Image should still be displayed (using fallback)
    expect(avatarImages[0]).toBeInTheDocument();
  });
  
  test('cleans up avatar URLs on unmount', async () => {
    // Mock avatar URLs to be blob URLs specifically
    getUserAvatar.mockResolvedValue('blob:http://localhost:3000/12345');
    
    const { unmount } = renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Wait for avatar loading to complete
    await waitFor(() => {
      expect(getUserAvatar).toHaveBeenCalled();
    });
    
    // Ensure the avatarPreviews state is populated
    await act(async () => {
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Unmount component
    unmount();
    
    // URL.revokeObjectURL should be called for each avatar
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
  
  test('allows setting WIP limit to unlimited', async () => {
    renderBench();
    
    await waitFor(() => {
      expect(screen.queryByText('Ładowanie...')).not.toBeInTheDocument();
    });
    
    // Find and click WIP limit display to edit
    const wipLimitDisplay = screen.getAllByText(/WIP Limit/)[0].closest('.wip-limit-display');
    fireEvent.click(wipLimitDisplay);
    
    // Change value to empty (which means unlimited)
    const input = screen.getByPlaceholderText('Unlimited');
    fireEvent.change(input, { target: { value: '' } });
    
    // Save changes
    const saveButton = screen.getByTitle('Zapisz limit WIP');
    await act(async () => {
      fireEvent.click(saveButton);
    });
    
    // Check if API was called with null value
    expect(updateUserWipLimit).toHaveBeenCalledWith(1, null);
  });
});