import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { 
  AnimatedContainer, 
  AnimatedListItem, 
  AnimatedButton, 
  AnimatedNotification, 
  AnimatedMessage 
} from '../animated-container'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div data-testid="motion-div" {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button data-testid="motion-button" {...props}>{children}</button>,
  },
}))

// Mock useAnimations hook
const mockUseAnimations = {
  getEntranceProps: vi.fn(() => ({
    initial: 'initial',
    animate: 'animate',
    variants: {},
    transition: { duration: 0.3 },
  })),
  getStaggerProps: vi.fn(() => ({
    animate: 'animate',
    transition: { staggerChildren: 0.1 },
  })),
  getHoverProps: vi.fn(() => ({
    whileHover: 'hover',
    whileTap: 'tap',
    variants: {},
  })),
  getVariants: vi.fn(() => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  })),
  shouldAnimate: true,
}

vi.mock('@/hooks/use-animations', () => ({
  useAnimations: () => mockUseAnimations,
}))

describe('AnimatedContainer', () => {
  it('should render children with animation props', () => {
    render(
      <AnimatedContainer variant="fadeIn" delay={0.1}>
        <div>Test content</div>
      </AnimatedContainer>
    )
    
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(mockUseAnimations.getEntranceProps).toHaveBeenCalledWith('fadeIn', 0.1)
  })

  it('should handle stagger animations', () => {
    render(
      <AnimatedContainer stagger={true} staggerDelay={0.2}>
        <div>Test content</div>
      </AnimatedContainer>
    )
    
    expect(mockUseAnimations.getStaggerProps).toHaveBeenCalledWith(0.2)
  })

  it('should apply custom className', () => {
    render(
      <AnimatedContainer className="custom-class">
        <div>Test content</div>
      </AnimatedContainer>
    )
    
    const container = screen.getByTestId('motion-div')
    expect(container).toHaveClass('custom-class')
  })

  it('should use default variant when none provided', () => {
    render(
      <AnimatedContainer>
        <div>Test content</div>
      </AnimatedContainer>
    )
    
    expect(mockUseAnimations.getEntranceProps).toHaveBeenCalledWith('fadeIn', 0)
  })
})

describe('AnimatedListItem', () => {
  it('should render with list item variants', () => {
    render(
      <AnimatedListItem variant="slideUp">
        <div>List item</div>
      </AnimatedListItem>
    )
    
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    expect(screen.getByText('List item')).toBeInTheDocument()
    expect(mockUseAnimations.getVariants).toHaveBeenCalledWith('slideUp')
  })

  it('should use default variant', () => {
    render(
      <AnimatedListItem>
        <div>List item</div>
      </AnimatedListItem>
    )
    
    expect(mockUseAnimations.getVariants).toHaveBeenCalledWith('slideUp')
  })
})

describe('AnimatedButton', () => {
  it('should render button with hover animations when enabled', () => {
    render(
      <AnimatedButton>
        Click me
      </AnimatedButton>
    )
    
    expect(screen.getByTestId('motion-button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
    expect(mockUseAnimations.getHoverProps).toHaveBeenCalled()
  })

  it('should not apply hover animations when disabled', () => {
    mockUseAnimations.getHoverProps.mockClear()
    
    render(
      <AnimatedButton disabled={true}>
        Click me
      </AnimatedButton>
    )
    
    // Should not call getHoverProps for disabled buttons
    expect(mockUseAnimations.getHoverProps).not.toHaveBeenCalled()
  })

  it('should handle click events', () => {
    const handleClick = vi.fn()
    
    render(
      <AnimatedButton onClick={handleClick}>
        Click me
      </AnimatedButton>
    )
    
    const button = screen.getByTestId('motion-button')
    button.click()
    
    expect(handleClick).toHaveBeenCalled()
  })
})

describe('AnimatedNotification', () => {
  it('should render with notification slide animation', () => {
    render(
      <AnimatedNotification>
        <div>Notification content</div>
      </AnimatedNotification>
    )
    
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    expect(screen.getByText('Notification content')).toBeInTheDocument()
    expect(mockUseAnimations.getEntranceProps).toHaveBeenCalledWith('notificationSlide')
  })
})

describe('AnimatedMessage', () => {
  it('should render with message enter animation', () => {
    render(
      <AnimatedMessage delay={0.2}>
        <div>Message content</div>
      </AnimatedMessage>
    )
    
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    expect(screen.getByText('Message content')).toBeInTheDocument()
    expect(mockUseAnimations.getEntranceProps).toHaveBeenCalledWith('messageEnter', 0.2)
  })

  it('should use default delay when none provided', () => {
    render(
      <AnimatedMessage>
        <div>Message content</div>
      </AnimatedMessage>
    )
    
    expect(mockUseAnimations.getEntranceProps).toHaveBeenCalledWith('messageEnter', 0)
  })
})

describe('Animation behavior when shouldAnimate is false', () => {
  beforeEach(() => {
    mockUseAnimations.shouldAnimate = false
  })

  afterEach(() => {
    mockUseAnimations.shouldAnimate = true
  })

  it('should still render components when animations are disabled', () => {
    render(
      <AnimatedContainer>
        <div>Test content</div>
      </AnimatedContainer>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('should not apply hover props when animations are disabled', () => {
    mockUseAnimations.getHoverProps.mockReturnValue({})
    
    render(
      <AnimatedButton>
        Click me
      </AnimatedButton>
    )
    
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})