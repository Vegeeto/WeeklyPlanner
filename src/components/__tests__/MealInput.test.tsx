import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MealInput from '../MealInput';
import React from 'react';

describe('MealInput', () => {
  const mockRecipes = [
    { id: '1', name: 'Pasta Carbonara', ingredients: 'Pasta, Eggs, Bacon', instructions: 'Cook it', userId: 'user1', createdAt: new Date() },
    { id: '2', name: 'Salad', ingredients: 'Lettuce, Tomato', instructions: 'Mix it', userId: 'user1', createdAt: new Date() },
  ];

  it('renders with placeholder', () => {
    render(<MealInput value="" onChange={() => {}} recipes={mockRecipes} placeholder="Test Placeholder" />);
    expect(screen.getByPlaceholderText('Test Placeholder')).toBeDefined();
  });

  it('calls onChange when typing', () => {
    const handleChange = vi.fn();
    render(<MealInput value="" onChange={handleChange} recipes={mockRecipes} />);
    
    const input = screen.getByPlaceholderText('¿Qué hay para comer?');
    fireEvent.change(input, { target: { value: 'Pizza' } });
    
    expect(handleChange).toHaveBeenCalledWith('Pizza');
  });
});
