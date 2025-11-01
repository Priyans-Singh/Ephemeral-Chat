import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../ThemeContext'

// Test component to access theme context
function TestComponent() {
  const { theme, themeConfig, setTheme, setAccentColor, setAnimations, toggleTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="accent-color">{themeConfig.accentColor}</div>
      <div data-testid="animations">{themeConfig.animations.toString()}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('system')} data-testid="set-system">Set System</button>
      <button onClick={() => setAccentColor('blue')} data-testid="set-accent">Set Accent</button>
      <button onClick={() => setAnimations(false)} data-testid="disable-animations">Disable Animations</button>
      <button onClick={toggleTheme} data-testid="toggle-theme">Toggle Theme</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
    
    // Reset document classes
    document.documentElement.className = ''
  })

  it('should provide default theme configuration', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    expect(screen.getByTestId('accent-color')).toHaveTextContent('default')
    expect(screen.getByTestId('animations')).toHaveTextContent('true')
  })

  it('should set theme to dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-dark'))
    })

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('should set theme to light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-light'))
    })

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement).toHaveClass('light')
  })

  it('should handle system theme preference', () => {
    // Mock system preference for dark mode
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    
    window.matchMedia = mockMatchMedia

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-system'))
    })

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('should toggle theme between light and dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    // Start with light theme
    act(() => {
      fireEvent.click(screen.getByTestId('set-light'))
    })
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    // Toggle to dark
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-theme'))
    })
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')

    // Toggle back to light
    act(() => {
      fireEvent.click(screen.getByTestId('toggle-theme'))
    })
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should set accent color', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-accent'))
    })

    expect(screen.getByTestId('accent-color')).toHaveTextContent('blue')
  })

  it('should disable animations', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('disable-animations'))
    })

    expect(screen.getByTestId('animations')).toHaveTextContent('false')
    expect(document.documentElement).toHaveClass('reduce-motion')
  })

  it('should persist theme configuration to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    act(() => {
      fireEvent.click(screen.getByTestId('set-dark'))
      fireEvent.click(screen.getByTestId('set-accent'))
      fireEvent.click(screen.getByTestId('disable-animations'))
    })

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'theme-config',
      JSON.stringify({
        mode: 'dark',
        accentColor: 'blue',
        animations: false,
      })
    )
  })

  it('should load theme configuration from localStorage', () => {
    const storedConfig = {
      mode: 'dark',
      accentColor: 'red',
      animations: false,
    }
    
    localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(storedConfig))

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('accent-color')).toHaveTextContent('red')
    expect(screen.getByTestId('animations')).toHaveTextContent('false')
  })

  it('should throw error when useTheme is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })
})