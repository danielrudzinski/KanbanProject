import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../components/Header';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../components/LanguageSwitcher', () => {
  return function MockLanguageSwitcher() {
    return <div data-testid="mock-language-switcher"></div>;
  };
});

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

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    logout: jest.fn(),
    token: 'fake-token'
  }))
}));

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
    expect(screen.getByText('board.title')).toBeInTheDocument();
    expect(screen.getByText('header.addTask')).toBeInTheDocument();
    expect(screen.getByText('header.wipLimit')).toBeInTheDocument();
    expect(screen.getByText('header.addBoardItem')).toBeInTheDocument();
    expect(screen.getByText('header.users')).toBeInTheDocument();
  });

  test('opens AddTaskForm when "Dodaj zadanie" is clicked', () => {
    renderHeader();
    fireEvent.click(screen.getByText('header.addTask'));
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close'));    
    expect(screen.queryByTestId('mock-add-task-form')).not.toBeInTheDocument();
  });

  test('opens WipLimitControl when "Limit WIP" is clicked', () => {
    renderHeader();
    fireEvent.click(screen.getByText('header.wipLimit'));
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
    
    const homeLink = screen.getByText('board.title');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    
    const usersLink = screen.getByText('header.users').closest('a');
    expect(usersLink).toHaveAttribute('href', '/users');
  });

  test('can only have one form open at a time', () => {
    renderHeader();
    
    fireEvent.click(screen.getByText('header.addTask'));
    expect(screen.getByTestId('mock-add-task-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('header.wipLimit'));
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
    
    const addRowColumnButton = screen.getByText('header.addBoardItem');
    fireEvent.click(addRowColumnButton);
    expect(screen.getByTestId('mock-add-board-item-form')).toBeInTheDocument();
    
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('mock-add-board-item-form')).not.toBeInTheDocument();
  });
  
});