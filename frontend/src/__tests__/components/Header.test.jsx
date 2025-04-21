import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../components/Header';

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
    global.window.scrollY = 0;
  });

  test('renders header with logo and navigation links', () => {
    renderHeader();
    expect(screen.getByText('Tablica Kanban')).toBeInTheDocument();
    expect(screen.getByText('Dodaj zadanie')).toBeInTheDocument();
    expect(screen.getByText('Limit WIP')).toBeInTheDocument();
    expect(screen.getByText('Dodaj wiersz/kolumnę')).toBeInTheDocument();
    expect(screen.getByText('Użytkownicy')).toBeInTheDocument();
  });

  test('opens AddTaskForm when "Dodaj zadanie" is clicked', () => {
    renderHeader();
    fireEvent.click(screen.getByText('Dodaj zadanie'));
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));    
    expect(screen.queryByTestId('mock-add-task-form')).not.toBeInTheDocument();
  });

  test('opens WipLimitControl when "Limit WIP" is clicked', () => {
    renderHeader();
    fireEvent.click(screen.getByText('Limit WIP'));
    expect(screen.getByTestId('mock-wip-limit-control')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('mock-wip-limit-control')).not.toBeInTheDocument();
  });

  test('makes header sticky on scroll', async () => {
    renderHeader();
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('sticky');
    await act(async () => {
      global.window.scrollY = 100;
      global.window.dispatchEvent(new Event('scroll'));
    });
    expect(header).toHaveClass('sticky');
    await act(async () => {
      global.window.scrollY = 0;
      global.window.dispatchEvent(new Event('scroll'));
    });
    expect(header).not.toHaveClass('sticky');
  });

  test('has correct navigation links with proper attributes', () => {
    renderHeader();
    
    const homeLink = screen.getByText('Tablica Kanban');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    
    const usersLink = screen.getByText('Użytkownicy').closest('a');
    expect(usersLink).toHaveAttribute('href', '/users');
  });

  test('can only have one form open at a time', () => {
    renderHeader();
    
    fireEvent.click(screen.getByText('Dodaj zadanie'));
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Limit WIP'));
    expect(screen.queryByTestId('mock-add-task-form')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-wip-limit-control')).toBeInTheDocument();
  });

  test('cleans up scroll event listener on unmount', async () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderHeader();
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  test('opens and closes the AddBoardItemForm when "Add row/column" button is clicked', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
    
    const addRowColumnButton = screen.getByText(/Dodaj wiersz\/kolumnę/i);
    fireEvent.click(addRowColumnButton);
    expect(screen.getByTestId('mock-add-board-item-form')).toBeInTheDocument();
    
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('mock-add-board-item-form')).not.toBeInTheDocument();
  });
  
});