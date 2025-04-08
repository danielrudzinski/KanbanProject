import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../components/Footer';

describe('Footer Component', () => {
  test('renders footer with copyright information', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('app-footer');
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Tablica Kanban`))).toBeInTheDocument();
  });

  test('renders footer links', () => {
    render(<Footer />);
    
    expect(screen.getByText('Pomoc')).toBeInTheDocument();
    expect(screen.getByText('O nas')).toBeInTheDocument();
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
  });
  
  test('renders links as anchor elements', () => {
    render(<Footer />);
    
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3); 
    
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '#');
      expect(link).toHaveClass('footer-link');
    });
  });
});