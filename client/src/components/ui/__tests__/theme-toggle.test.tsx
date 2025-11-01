import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeToggle, SimpleThemeToggle } from '../theme-toggle'
import { beforeEach } from 'node:test'
import { beforeEach } from 'node:test'

// Mock the useTheme hook
const mockSetTheme = vi.fn()
const mockToggleTheme = vi.fn()

vi.mock('@/contexts/ThemeContext', async () => {
  const actual = await vi.importActual('@/contexts/ThemeContext')
  return {
    ...actual,
    useTheme: () => ({
      theme: 'light',
      setTheme: mockSetTheme,
      toggleTheme: mockToggleTheme,
      themeConfig: {
        mode: 'light',
        accentColor: 'default',
        animations: true,
      },
    }),
  }
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render theme toggle dropdown', () => {
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
    expect(toggleButton).toHaveAttribute('aria-haspopup')
  })

  it('should have proper accessibility attributes', () => {
    render(<ThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toHaveAttribute('aria-haspopup')
    
    const srText = screen.getByText('Toggle theme')
    expect(srText).toHaveClass('sr-only')
  })

  it('should render sun and moon icons', () => {
    render(<ThemeToggle />)
    
    // Check that both sun and moon icons are present (one visible, one hidden)
    const sunIcon = document.querySelector('.lucide-sun')
    const moonIcon = document.querySelector('.lucide-moon')
    
    expect(sunIcon).toBeInTheDocument()
    expect(moonIcon).toBeInTheDocument()
  })
})

describe('SimpleThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render simple theme toggle button', () => {
    render(<SimpleThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
  })

  it('should call toggleTheme when clicked', () => {
    render(<SimpleThemeToggle />)
    
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)
    
    expect(mockToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('should have proper accessibility attributes', () => {
    render(<SimpleThemeToggle />)
    
    const srText = screen.getByText('Toggle theme')
    expect(srText).toHaveClass('sr-only')
  })
})