import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../components/Footer';

describe('Footer Component', () => {
  test('renders footer with copyright information', () => {
    render(<Footer />);
    
    // Check for footer element
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass('app-footer');
    
    // Check for copyright information - updated to match the actual text
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Tablica Kanban`))).toBeInTheDocument();
  });

  test('renders footer links', () => {
    render(<Footer />);
    
    // Check for footer links
    expect(screen.getByText('Pomoc')).toBeInTheDocument();
    expect(screen.getByText('O nas')).toBeInTheDocument();
    expect(screen.getByText('Kontakt')).toBeInTheDocument();
  });
  
  test('renders links as anchor elements', () => {
    render(<Footer />);
    
    // Check for links
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3); // Three links: Pomoc, O nas, Kontakt
    
    // Check if they have proper href attributes
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '#');
      expect(link).toHaveClass('footer-link');
    });
  });
});