/**
 * Animation performance optimization utilities
 * Provides tools for monitoring and optimizing animation performance
 */

// Performance monitoring
export class AnimationPerformanceMonitor {
  private static instance: AnimationPerformanceMonitor;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isMonitoring = false;
  private callbacks: ((fps: number) => void)[] = [];

  static getInstance(): AnimationPerformanceMonitor {
    if (!AnimationPerformanceMonitor.instance) {
      AnimationPerformanceMonitor.instance = new AnimationPerformanceMonitor();
    }
    return AnimationPerformanceMonitor.instance;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.measureFPS();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  onFPSUpdate(callback: (fps: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  private measureFPS(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.callbacks.forEach(callback => callback(this.fps));
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.measureFPS());
  }

  getCurrentFPS(): number {
    return this.fps;
  }
}

// Performance optimization utilities
export const animationOptimizations = {
  /**
   * Check if device supports hardware acceleration
   */
  supportsHardwareAcceleration(): boolean {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  },

  /**
   * Check if device is low-end based on various factors
   */
  isLowEndDevice(): boolean {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 1;
    if (cores <= 2) return true;

    // Check memory (if available)
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 2) return true;

    // Check connection speed
    const connection = (navigator as any).connection;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
      return true;
    }

    return false;
  },

  /**
   * Get optimal animation settings based on device capabilities
   */
  getOptimalSettings(): {
    enableComplexAnimations: boolean;
    maxConcurrentAnimations: number;
    preferReducedMotion: boolean;
    useGPUAcceleration: boolean;
  } {
    const isLowEnd = this.isLowEndDevice();
    const supportsGPU = this.supportsHardwareAcceleration();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      enableComplexAnimations: !isLowEnd && !prefersReducedMotion,
      maxConcurrentAnimations: isLowEnd ? 3 : 10,
      preferReducedMotion: prefersReducedMotion,
      useGPUAcceleration: supportsGPU,
    };
  },

  /**
   * Throttle animation updates to improve performance
   */
  createThrottledAnimationFrame(callback: () => void, fps = 60): () => void {
    let lastTime = 0;
    const interval = 1000 / fps;
    let animationId: number;

    const throttledCallback = (currentTime: number) => {
      if (currentTime - lastTime >= interval) {
        callback();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(throttledCallback);
    };

    animationId = requestAnimationFrame(throttledCallback);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  },

  /**
   * Create a debounced animation trigger
   */
  createDebouncedAnimation(callback: () => void, delay = 100): () => void {
    let timeoutId: NodeJS.Timeout;

    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  },

  /**
   * Check if element is in viewport (for lazy animation loading)
   */
  isInViewport(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Create intersection observer for viewport-based animations
   */
  createViewportAnimationObserver(
    callback: (entries: IntersectionObserverEntry[]) => void,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    };

    return new IntersectionObserver(callback, defaultOptions);
  },
};

// CSS optimization utilities
export const cssOptimizations = {
  /**
   * Generate optimized CSS transform string
   */
  generateTransform(transforms: {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
  }): string {
    const parts: string[] = [];

    // Use translate3d for hardware acceleration
    if (transforms.translateX !== undefined || transforms.translateY !== undefined || transforms.translateZ !== undefined) {
      const x = transforms.translateX || 0;
      const y = transforms.translateY || 0;
      const z = transforms.translateZ || 0;
      parts.push(`translate3d(${x}px, ${y}px, ${z}px)`);
    }

    // Scale transforms
    if (transforms.scale !== undefined) {
      parts.push(`scale(${transforms.scale})`);
    } else {
      if (transforms.scaleX !== undefined) parts.push(`scaleX(${transforms.scaleX})`);
      if (transforms.scaleY !== undefined) parts.push(`scaleY(${transforms.scaleY})`);
    }

    // Rotation transforms
    if (transforms.rotate !== undefined) parts.push(`rotate(${transforms.rotate}deg)`);
    if (transforms.rotateX !== undefined) parts.push(`rotateX(${transforms.rotateX}deg)`);
    if (transforms.rotateY !== undefined) parts.push(`rotateY(${transforms.rotateY}deg)`);
    if (transforms.rotateZ !== undefined) parts.push(`rotateZ(${transforms.rotateZ}deg)`);

    return parts.join(' ');
  },

  /**
   * Apply hardware acceleration styles
   */
  getHardwareAccelerationStyles(): React.CSSProperties {
    return {
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      perspective: 1000,
    };
  },

  /**
   * Get will-change property for performance optimization
   */
  getWillChangeProperty(properties: string[]): string {
    return properties.join(', ');
  },
};

// Memory management for animations
export class AnimationMemoryManager {
  private static activeAnimations = new Set<string>();
  private static maxAnimations = 10;

  static setMaxAnimations(max: number): void {
    this.maxAnimations = max;
  }

  static canStartAnimation(id: string): boolean {
    if (this.activeAnimations.size >= this.maxAnimations) {
      return false;
    }
    return true;
  }

  static startAnimation(id: string): boolean {
    if (!this.canStartAnimation(id)) {
      return false;
    }
    this.activeAnimations.add(id);
    return true;
  }

  static endAnimation(id: string): void {
    this.activeAnimations.delete(id);
  }

  static getActiveCount(): number {
    return this.activeAnimations.size;
  }

  static clearAll(): void {
    this.activeAnimations.clear();
  }
}

// Accessibility utilities
export const accessibilityUtils = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Create media query listener for reduced motion preference
   */
  onReducedMotionChange(callback: (prefersReduced: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  },

  /**
   * Get safe animation duration based on user preferences
   */
  getSafeAnimationDuration(normalDuration: number): number {
    return this.prefersReducedMotion() ? 0 : normalDuration;
  },

  /**
   * Get safe animation properties for accessibility
   */
  getSafeAnimationProps(props: any): any {
    if (this.prefersReducedMotion()) {
      return {
        ...props,
        transition: { duration: 0 },
        animate: props.animate,
        initial: props.animate, // Skip initial state, go directly to animate state
      };
    }
    return props;
  },
};