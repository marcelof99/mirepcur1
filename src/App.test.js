import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders welcome message and department options', () => {
  render(<App />);
  
  // Check for welcome message
  expect(screen.getByText(/Bienvenido al Programa de Severance/i)).toBeInTheDocument();
  
  // Check for department options
  expect(screen.getByText(/MDR/i)).toBeInTheDocument();
  expect(screen.getByText(/O&D/i)).toBeInTheDocument();
  expect(screen.getByText(/W&A/i)).toBeInTheDocument();
});

test('selecting MDR department shows access message', () => {
  render(<App />);
  
  // Find and click the MDR option
  const mdrOption = screen.getByText(/MDR/i);
  fireEvent.click(mdrOption);
  
  // Check for access message
  expect(screen.getByText(/Acceso concedido a MDR/i)).toBeInTheDocument();
});
