import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAnimations } from '../use-animations'

// Mock the ThemeContext
const mockThemeConfig = {
  mode: 'light' as const,
  accentColor: 'default',
  animations: true,
  performanceMode: 'auto' as const,
  reducedMotion: false,
}

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}))

// Mock animation performance utilities
vi.mock('@/lib/animation-performance', () => ({
  animationOptimizations: {
    getOptimalSettings: () => ({
      enableComplexAnimations: true,
      maxConcurrentAnimations: 10,
      preferReducedMotion: false,
      useGPUAcceleration: true,
    }),
  },
  AnimationMemoryManager: {
    setMaxAnimations: vi.fn(),
    canStartAnimation: vi.fn(() => true),
    startAnimation: vi.fn(),
    endAnimation: vi.fn(),
  },
  accessibilityUtils: {
    onReducedMotionChange: vi.fn(() => () => {}),
    prefersReducedMotion: vi.fn(() => false),
    getSafeAnimationDuration: vi.fn((duration) => duration),
    getSafeAnimationProps: vi.fn((props) => props),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockThemeConfig.animations = true
    mockThemeConfig.reducedMotion = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('shouldAnimate', () => {
    it('should return true when animations are enabled and no reduced motion', () => {
      const { result } = renderHook(() => useAnimations())
      expect(result.current.shouldAnimate).toBe(true)
    })

    it('should return false when animations are disabled in theme', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      expect(result.current.shouldAnimate).toBe(false)
    })

    it('should return false when reduced motion is preferred', () => {
      const { accessibilityUtils } = require('@/lib/animation-performance')
      accessibilityUtils.prefersReducedMotion.mockReturnValue(true)
      
      const { result } = renderHook(() => useAnimations())
      expect(result.current.shouldAnimate).toBe(false)
    })
  })

  describe('getVariants', () => {
    it('should return normal variants when animations are enabled', () => {
      const { result } = renderHook(() => useAnimations())
      const variants = result.current.getVariants('fadeIn')
      
      expect(variants).toHaveProperty('initial')
      expect(variants).toHaveProperty('animate')
      expect(variants).toHaveProperty('exit')
    })

    it('should return reduced motion variants when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const variants = result.current.getVariants('fadeIn')
      
      // Reduced motion variants should have simpler animations
      expect(variants.initial).toEqual({ opacity: 0 })
      expect(variants.animate).toEqual({ opacity: 1 })
    })
  })

  describe('getTransition', () => {
    it('should return transition with specified duration and easing', () => {
      const { result } = renderHook(() => useAnimations())
      const transition = result.current.getTransition('fast', 'easeOut')
      
      expect(transition).toHaveProperty('duration', 0.15)
      expect(transition).toHaveProperty('ease')
    })

    it('should return zero duration when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const transition = result.current.getTransition('normal')
      
      expect(transition).toEqual({ duration: 0 })
    })

    it('should handle spring easing correctly', () => {
      const { result } = renderHook(() => useAnimations())
      const transition = result.current.getTransition('normal', 'spring')
      
      expect(transition).toHaveProperty('type', 'spring')
      expect(transition).toHaveProperty('stiffness')
      expect(transition).toHaveProperty('damping')
    })
  })

  describe('getHoverProps', () => {
    it('should return hover animation props when animations are enabled', () => {
      const { result } = renderHook(() => useAnimations())
      const hoverProps = result.current.getHoverProps()
      
      expect(hoverProps).toHaveProperty('whileHover')
      expect(hoverProps).toHaveProperty('whileTap')
      expect(hoverProps).toHaveProperty('variants')
      expect(hoverProps).toHaveProperty('transition')
    })

    it('should return empty object when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const hoverProps = result.current.getHoverProps()
      
      expect(hoverProps).toEqual({})
    })

    it('should include GPU acceleration styles when supported', () => {
      const { result } = renderHook(() => useAnimations())
      const hoverProps = result.current.getHoverProps()
      
      expect(hoverProps).toHaveProperty('style')
      expect(hoverProps.style).toHaveProperty('transform', 'translateZ(0)')
      expect(hoverProps.style).toHaveProperty('backfaceVisibility', 'hidden')
    })
  })

  describe('getEntranceProps', () => {
    it('should return entrance animation props with specified variant', () => {
      const { result } = renderHook(() => useAnimations())
      const entranceProps = result.current.getEntranceProps('slideUp', 0.1)
      
      expect(entranceProps).toHaveProperty('initial', 'initial')
      expect(entranceProps).toHaveProperty('animate', 'animate')
      expect(entranceProps).toHaveProperty('exit', 'exit')
      expect(entranceProps).toHaveProperty('variants')
      expect(entranceProps.transition).toHaveProperty('delay', 0.1)
    })

    it('should handle animation memory management', () => {
      const { AnimationMemoryManager } = require('@/lib/animation-performance')
      AnimationMemoryManager.canStartAnimation.mockReturnValue(false)
      
      const { result } = renderHook(() => useAnimations())
      const entranceProps = result.current.getEntranceProps('fadeIn', 0, 'test-animation')
      
      // Should return safe props when animation limit is reached
      expect(entranceProps.initial).toBe('animate')
      expect(entranceProps.animate).toBe('animate')
    })

    it('should include animation lifecycle callbacks when animation ID is provided', () => {
      const { result } = renderHook(() => useAnimations())
      const entranceProps = result.current.getEntranceProps('fadeIn', 0, 'test-animation')
      
      expect(entranceProps).toHaveProperty('onAnimationStart')
      expect(entranceProps).toHaveProperty('onAnimationComplete')
    })
  })

  describe('getStaggerProps', () => {
    it('should return stagger animation props with specified delay', () => {
      const { result } = renderHook(() => useAnimations())
      const staggerProps = result.current.getStaggerProps(0.2)
      
      expect(staggerProps).toHaveProperty('animate', 'animate')
      expect(staggerProps.transition).toHaveProperty('staggerChildren', 0.2)
    })

    it('should return zero duration when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const staggerProps = result.current.getStaggerProps()
      
      expect(staggerProps.transition).toHaveProperty('duration', 0)
    })
  })

  describe('getLoadingProps', () => {
    it('should return loading animation props when animations are enabled', () => {
      const { result } = renderHook(() => useAnimations())
      const loadingProps = result.current.getLoadingProps()
      
      expect(loadingProps).toHaveProperty('animate')
      expect(loadingProps.animate).toHaveProperty('opacity')
      expect(loadingProps.animate.transition).toHaveProperty('repeat', Infinity)
    })

    it('should return empty object when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const loadingProps = result.current.getLoadingProps()
      
      expect(loadingProps).toEqual({})
    })
  })

  describe('getTypingProps', () => {
    it('should return typing animation props with delay', () => {
      const { result } = renderHook(() => useAnimations())
      const typingProps = result.current.getTypingProps(0.2)
      
      expect(typingProps).toHaveProperty('animate')
      expect(typingProps.animate).toHaveProperty('y')
      expect(typingProps.animate.transition).toHaveProperty('delay', 0.2)
    })

    it('should return empty object when animations are disabled', () => {
      mockThemeConfig.animations = false
      const { result } = renderHook(() => useAnimations())
      const typingProps = result.current.getTypingProps()
      
      expect(loadingProps).toEqual({})
    })
  })

  describe('device capabilities', () => {
    it('should include device capabilities in return value', () => {
      const { result } = renderHook(() => useAnimations())
      
      expect(result.current).toHaveProperty('deviceCapabilities')
      expect(result.current.deviceCapabilities).toHaveProperty('enableComplexAnimations')
      expect(result.current.deviceCapabilities).toHaveProperty('maxConcurrentAnimations')
      expect(result.current.deviceCapabilities).toHaveProperty('useGPUAcceleration')
    })
  })

  describe('reduced motion preference changes', () => {
    it('should update when reduced motion preference changes', () => {
      const { accessibilityUtils } = require('@/lib/animation-performance')
      let changeCallback: (prefersReduced: boolean) => void
      
      accessibilityUtils.onReducedMotionChange.mockImplementation((callback) => {
        changeCallback = callback
        return () => {}
      })
      
      const { result } = renderHook(() => useAnimations())
      
      // Initially animations should be enabled
      expect(result.current.shouldAnimate).toBe(true)
      
      // Simulate reduced motion preference change
      act(() => {
        changeCallback(true)
      })
      
      // Should update the preference
      expect(result.current.prefersReducedMotion).toBe(true)
    })
  })
})