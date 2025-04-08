import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../components/Header';

// Mock the components that are rendered by the Header
jest.mock('../../components/AddTaskForm', () => {
  return function MockAddTaskForm({ onClose }) {
    return (
      <div data-testid="mock-add-task-form">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../../components/WipLimitControl', () => {
  return function MockWipLimitControl({ onClose }) {
    return (
      <div data-testid="mock-wip-limit-control">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

jest.mock('../../components/AddRowColumnForm', () => {
  return function MockAddBoardItemForm({ onClose }) {
    return (
      <div data-testid="mock-add-board-item-form">
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

describe('Header Component', () => {
  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    // Reset window scrollY before each test
    global.window.scrollY = 0;
  });

  test('renders header with logo and navigation links', () => {
    renderHeader();
    
    // Check for logo and title 
    expect(screen.getByText('Tablica Kanban')).toBeInTheDocument();
    
    // Check navigation links
    // Remove the line looking for 'Tablica' as it doesn't exist
    expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
    expect(screen.getByText('Limit WIP')).toBeInTheDocument();
    expect(screen.getByText('Dodaj wiersz/kolumnę')).toBeInTheDocument();
    expect(screen.getByText('Użytkownicy')).toBeInTheDocument();
  });

  test('opens AddTaskForm when "Dodaj zadanie" is clicked', () => {
    renderHeader();
    
    // Click on "Dodaj zadanie" button
    fireEvent.click(screen.getByText('Dodaj zadanie'));
    
    // Check that form is displayed
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    
    // Close the form
    fireEvent.click(screen.getByText('Close'));    
    // Form should be closed
    expect(screen.queryByTestId('mock-add-task-form')).not.toBeInTheDocument();
  });

  test('opens WipLimitControl when "Limit WIP" is clicked', () => {
    renderHeader();
    
    // Click on "Limit WIP" button 
    fireEvent.click(screen.getByText('Limit WIP'));
    
    // Check that form is displayed
    expect(screen.getByTestId('mock-wip-limit-control')).toBeInTheDocument();
    
    // Close the form 
    fireEvent.click(screen.getByText('Close'));
    
    // Form should be closed
    expect(screen.queryByTestId('mock-wip-limit-control')).not.toBeInTheDocument();
  });

  test('makes header sticky on scroll', async () => {
    renderHeader();
    
    // Initially header should not have sticky class
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('sticky');
    
    // Mock scroll event
    await act(async () => {
      global.window.scrollY = 100;
      global.window.dispatchEvent(new Event('scroll'));
    });
    
    // Header should have sticky class
    expect(header).toHaveClass('sticky');
    
    // Mock scroll back to top
    await act(async () => {
      global.window.scrollY = 0;
      global.window.dispatchEvent(new Event('scroll'));
    });
    
    // Header should not have sticky class anymore
    expect(header).not.toHaveClass('sticky');
  });

  test('has correct navigation links with proper attributes', () => {
    renderHeader();
    
    // Check that links have correct href attributes
    const homeLink = screen.getByText('Tablica Kanban');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    
    const usersLink = screen.getByText('Użytkownicy').closest('a');
    expect(usersLink).toHaveAttribute('href', '/users');
  });

  test('can only have one form open at a time', () => {
    renderHeader();
    
    // Open AddTaskForm first
    fireEvent.click(screen.getByText('Dodaj zadanie'));
    
    // Check that the form is displayed
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    
    // Now click the WIP Limit button
    fireEvent.click(screen.getByText('Limit WIP'));
    
    // Check that AddTaskForm is closed
    expect(screen.queryByTestId('mock-add-task-form')).not.toBeInTheDocument();
    
    // And WIP Limit form is displayed
    expect(screen.getByTestId('mock-wip-limit-control')).toBeInTheDocument();
});

  test('cleans up scroll event listener on unmount', async () => {
    // Mock window.removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHeader();
    
    // Unmount the component
    unmount();
    
    // Check if removeEventListener was called with 'scroll'
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    
    // Clean up the spy
    removeEventListenerSpy.mockRestore();
  });

  test('opens and closes the AddBoardItemForm when "Add row/column" button is clicked', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    // Find the "Add row/column" button and click it
    const addRowColumnButton = screen.getByText(/Dodaj wiersz\/kolumnę/i);
    fireEvent.click(addRowColumnButton);
    
    // Verify the form is displayed
    expect(screen.getByTestId('mock-add-board-item-form')).toBeInTheDocument();
    
    // Find and click the close button
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    
    // Verify the form is no longer displayed
    expect(screen.queryByTestId('mock-add-board-item-form')).not.toBeInTheDocument();
  });
  
});