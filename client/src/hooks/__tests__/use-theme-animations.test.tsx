import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useThemeAnimations } from '../use-theme-animations'

// Mock the useTheme hook
const mockThemeConfig = {
  mode: 'light' as const,
  accentColor: 'default',
  animations: true,
}

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    themeConfig: mockThemeConfig,
  }),
}))

describe('useThemeAnimations', () => {
  it('should return animations enabled when theme config allows animations', () => {
    mockThemeConfig.animations = true
    
    const { result } = renderHook(() => useThemeAnimations())
    
    expect(result.current.animationsEnabled).toBe(true)
  })

  it('should return animations disabled when theme config disables animations', () => {
    mockThemeConfig.animations = false
    
    const { result } = renderHook(() => useThemeAnimations())
    
    expect(result.current.animationsEnabled).toBe(false)
  })

  it('should return original animation props when animations are enabled', () => {
    mockThemeConfig.animations = true
    
    const { result } = renderHook(() => useThemeAnimations())
    
    const baseProps = {
      animate: { opacity: 1 },
      initial: { opacity: 0 },
      transition: { duration: 0.3 },
    }
    
    const animationProps = result.current.getAnimationProps(baseProps)
    
    expect(animationProps).toEqual(baseProps)
  })

  it('should return modified animation props when animations are disabled', () => {
    mockThemeConfig.animations = false
    
    const { result } = renderHook(() => useThemeAnimations())
    
    const baseProps = {
      animate: { opacity: 1 },
      initial: { opacity: 0 },
      transition: { duration: 0.3 },
    }
    
    const animationProps = result.current.getAnimationProps(baseProps)
    
    expect(animationProps).toEqual({
      ...baseProps,
      transition: { duration: 0 },
    })
  })

  it('should return normal transition duration when animations are enabled', () => {
    mockThemeConfig.animations = true
    
    const { result } = renderHook(() => useThemeAnimations())
    
    const transitionProps = result.current.getTransitionProps(0.5)
    
    expect(transitionProps).toEqual({ duration: 0.5 })
  })

  it('should return zero transition duration when animations are disabled', () => {
    mockThemeConfig.animations = false
    
    const { result } = renderHook(() => useThemeAnimations())
    
    const transitionProps = result.current.getTransitionProps(0.5)
    
    expect(transitionProps).toEqual({ duration: 0 })
  })

  it('should use default duration when none provided', () => {
    mockThemeConfig.animations = true
    
    const { result } = renderHook(() => useThemeAnimations())
    
    const transitionProps = result.current.getTransitionProps()
    
    expect(transitionProps).toEqual({ duration: 0.2 })
  })
})