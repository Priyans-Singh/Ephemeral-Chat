import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  AnimationPerformanceMonitor, 
  animationOptimizations, 
  AnimationMemoryManager,
  accessibilityUtils,
  cssOptimizations
} from '../animation-performance'

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
  },
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // Simulate 60fps
  return 1
})

global.cancelAnimationFrame = vi.fn()

// Mock navigator properties
Object.defineProperty(global.navigator, 'hardwareConcurrency', {
  writable: true,
  value: 4,
})

Object.defineProperty(global.navigator, 'deviceMemory', {
  writable: true,
  value: 8,
})

Object.defineProperty(global.navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
  },
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('AnimationPerformanceMonitor', () => {
  let monitor: AnimationPerformanceMonitor

  beforeEach(() => {
    monitor = AnimationPerformanceMonitor.getInstance()
    vi.clearAllMocks()
  })

  afterEach(() => {
    monitor.stopMonitoring()
  })

  it('should be a singleton', () => {
    const monitor1 = AnimationPerformanceMonitor.getInstance()
    const monitor2 = AnimationPerformanceMonitor.getInstance()
    expect(monitor1).toBe(monitor2)
  })

  it('should start and stop monitoring', () => {
    expect(monitor.getCurrentFPS()).toBe(0)
    
    monitor.startMonitoring()
    expect(requestAnimationFrame).toHaveBeenCalled()
    
    monitor.stopMonitoring()
    // Should stop the monitoring loop
  })

  it('should call FPS update callbacks', (done) => {
    const callback = vi.fn((fps) => {
      expect(typeof fps).toBe('number')
      cleanup()
      done()
    })
    
    const cleanup = monitor.onFPSUpdate(callback)
    monitor.startMonitoring()
    
    // Simulate time passing for FPS calculation
    setTimeout(() => {
      // FPS calculation should trigger callback
    }, 1100)
  })

  it('should remove FPS update callbacks', () => {
    const callback = vi.fn()
    const cleanup = monitor.onFPSUpdate(callback)
    
    cleanup()
    
    monitor.startMonitoring()
    // Callback should not be called after cleanup
    expect(callback).not.toHaveBeenCalled()
  })
})

describe('animationOptimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('supportsHardwareAcceleration', () => {
    it('should return true when WebGL is supported', () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({}),
      }
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
      
      const result = animationOptimizations.supportsHardwareAcceleration()
      expect(result).toBe(true)
    })

    it('should return false when WebGL is not supported', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      }
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
      
      const result = animationOptimizations.supportsHardwareAcceleration()
      expect(result).toBe(false)
    })
  })

  describe('isLowEndDevice', () => {
    it('should return true for devices with 2 or fewer CPU cores', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 })
      
      const result = animationOptimizations.isLowEndDevice()
      expect(result).toBe(true)
    })

    it('should return true for devices with 2GB or less memory', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 2 })
      
      const result = animationOptimizations.isLowEndDevice()
      expect(result).toBe(true)
    })

    it('should return true for slow network connections', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 4 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
      Object.defineProperty(navigator, 'connection', { 
        value: { effectiveType: 'slow-2g' }
      })
      
      const result = animationOptimizations.isLowEndDevice()
      expect(result).toBe(true)
    })

    it('should return false for high-end devices', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
      Object.defineProperty(navigator, 'deviceMemory', { value: 16 })
      Object.defineProperty(navigator, 'connection', { 
        value: { effectiveType: '4g' }
      })
      
      const result = animationOptimizations.isLowEndDevice()
      expect(result).toBe(false)
    })
  })

  describe('getOptimalSettings', () => {
    it('should return appropriate settings for high-end devices', () => {
      vi.spyOn(animationOptimizations, 'isLowEndDevice').mockReturnValue(false)
      vi.spyOn(animationOptimizations, 'supportsHardwareAcceleration').mockReturnValue(true)
      
      const settings = animationOptimizations.getOptimalSettings()
      
      expect(settings.enableComplexAnimations).toBe(true)
      expect(settings.maxConcurrentAnimations).toBe(10)
      expect(settings.useGPUAcceleration).toBe(true)
    })

    it('should return conservative settings for low-end devices', () => {
      vi.spyOn(animationOptimizations, 'isLowEndDevice').mockReturnValue(true)
      vi.spyOn(animationOptimizations, 'supportsHardwareAcceleration').mockReturnValue(false)
      
      const settings = animationOptimizations.getOptimalSettings()
      
      expect(settings.enableComplexAnimations).toBe(false)
      expect(settings.maxConcurrentAnimations).toBe(3)
      expect(settings.useGPUAcceleration).toBe(false)
    })
  })

  describe('createThrottledAnimationFrame', () => {
    it('should throttle animation frame calls', (done) => {
      const callback = vi.fn()
      const cleanup = animationOptimizations.createThrottledAnimationFrame(callback, 30)
      
      // Should throttle to 30fps (33.33ms interval)
      setTimeout(() => {
        expect(callback).toHaveBeenCalled()
        cleanup()
        done()
      }, 100)
    })
  })

  describe('createDebouncedAnimation', () => {
    it('should debounce animation calls', (done) => {
      const callback = vi.fn()
      const debouncedCallback = animationOptimizations.createDebouncedAnimation(callback, 50)
      
      // Call multiple times quickly
      debouncedCallback()
      debouncedCallback()
      debouncedCallback()
      
      // Should only call once after delay
      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1)
        done()
      }, 100)
    })
  })

  describe('isInViewport', () => {
    it('should return true for elements in viewport', () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 100,
          bottom: 200,
          right: 200,
        }),
      }
      
      Object.defineProperty(window, 'innerHeight', { value: 800 })
      Object.defineProperty(window, 'innerWidth', { value: 1200 })
      
      const result = animationOptimizations.isInViewport(mockElement as Element)
      expect(result).toBe(true)
    })

    it('should return false for elements outside viewport', () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: -100,
          left: -100,
          bottom: -50,
          right: -50,
        }),
      }
      
      const result = animationOptimizations.isInViewport(mockElement as Element)
      expect(result).toBe(false)
    })
  })
})

describe('AnimationMemoryManager', () => {
  beforeEach(() => {
    AnimationMemoryManager.clearAll()
    AnimationMemoryManager.setMaxAnimations(3)
  })

  it('should track active animations', () => {
    expect(AnimationMemoryManager.getActiveCount()).toBe(0)
    
    AnimationMemoryManager.startAnimation('test1')
    expect(AnimationMemoryManager.getActiveCount()).toBe(1)
    
    AnimationMemoryManager.startAnimation('test2')
    expect(AnimationMemoryManager.getActiveCount()).toBe(2)
    
    AnimationMemoryManager.endAnimation('test1')
    expect(AnimationMemoryManager.getActiveCount()).toBe(1)
  })

  it('should respect maximum animation limit', () => {
    AnimationMemoryManager.startAnimation('test1')
    AnimationMemoryManager.startAnimation('test2')
    AnimationMemoryManager.startAnimation('test3')
    
    expect(AnimationMemoryManager.canStartAnimation('test4')).toBe(false)
    expect(AnimationMemoryManager.startAnimation('test4')).toBe(false)
  })

  it('should allow new animations after others end', () => {
    AnimationMemoryManager.startAnimation('test1')
    AnimationMemoryManager.startAnimation('test2')
    AnimationMemoryManager.startAnimation('test3')
    
    AnimationMemoryManager.endAnimation('test1')
    
    expect(AnimationMemoryManager.canStartAnimation('test4')).toBe(true)
    expect(AnimationMemoryManager.startAnimation('test4')).toBe(true)
  })
})

describe('accessibilityUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('prefersReducedMotion', () => {
    it('should return true when user prefers reduced motion', () => {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion'),
      }))
      
      const result = accessibilityUtils.prefersReducedMotion()
      expect(result).toBe(true)
    })

    it('should return false when user does not prefer reduced motion', () => {
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
      }))
      
      const result = accessibilityUtils.prefersReducedMotion()
      expect(result).toBe(false)
    })
  })

  describe('getSafeAnimationDuration', () => {
    it('should return 0 when reduced motion is preferred', () => {
      vi.spyOn(accessibilityUtils, 'prefersReducedMotion').mockReturnValue(true)
      
      const result = accessibilityUtils.getSafeAnimationDuration(0.5)
      expect(result).toBe(0)
    })

    it('should return normal duration when reduced motion is not preferred', () => {
      vi.spyOn(accessibilityUtils, 'prefersReducedMotion').mockReturnValue(false)
      
      const result = accessibilityUtils.getSafeAnimationDuration(0.5)
      expect(result).toBe(0.5)
    })
  })

  describe('getSafeAnimationProps', () => {
    it('should modify props for reduced motion', () => {
      vi.spyOn(accessibilityUtils, 'prefersReducedMotion').mockReturnValue(true)
      
      const props = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
      
      const result = accessibilityUtils.getSafeAnimationProps(props)
      
      expect(result.transition.duration).toBe(0)
      expect(result.initial).toEqual(result.animate)
    })

    it('should return original props when reduced motion is not preferred', () => {
      vi.spyOn(accessibilityUtils, 'prefersReducedMotion').mockReturnValue(false)
      
      const props = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
      }
      
      const result = accessibilityUtils.getSafeAnimationProps(props)
      expect(result).toEqual(props)
    })
  })
})

describe('cssOptimizations', () => {
  describe('generateTransform', () => {
    it('should generate transform string with translate3d', () => {
      const result = cssOptimizations.generateTransform({
        translateX: 10,
        translateY: 20,
        translateZ: 5,
      })
      
      expect(result).toBe('translate3d(10px, 20px, 5px)')
    })

    it('should generate transform string with scale and rotation', () => {
      const result = cssOptimizations.generateTransform({
        scale: 1.2,
        rotate: 45,
      })
      
      expect(result).toBe('scale(1.2) rotate(45deg)')
    })

    it('should handle multiple transforms', () => {
      const result = cssOptimizations.generateTransform({
        translateX: 10,
        translateY: 20,
        scale: 1.1,
        rotate: 30,
      })
      
      expect(result).toContain('translate3d(10px, 20px, 0px)')
      expect(result).toContain('scale(1.1)')
      expect(result).toContain('rotate(30deg)')
    })
  })

  describe('getHardwareAccelerationStyles', () => {
    it('should return hardware acceleration styles', () => {
      const styles = cssOptimizations.getHardwareAccelerationStyles()
      
      expect(styles).toEqual({
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      })
    })
  })

  describe('getWillChangeProperty', () => {
    it('should join properties with commas', () => {
      const result = cssOptimizations.getWillChangeProperty(['transform', 'opacity'])
      expect(result).toBe('transform, opacity')
    })
  })
})