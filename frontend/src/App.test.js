import { render, screen } from '@testing-library/react';
import App from './App';

test('renders header', () => {
  render(<App />);
  const headerElement = screen.getByText(/MyApp - DevOps Pipeline Demo/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders add user section', () => {
  render(<App />);
  const addUserText = screen.getByText(/Add New User/i);
  expect(addUserText).toBeInTheDocument();
});
