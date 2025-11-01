import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState, useCallback } from 'react';
import { 
  ANIMATION_VARIANTS, 
  REDUCED_MOTION_VARIANTS, 
  ANIMATION_DURATIONS, 
  ANIMATION_EASINGS 
} from '@/lib/animation-config';
import { 
  animationOptimizations, 
  AnimationMemoryManager, 
  accessibilityUtils 
} from '@/lib/animation-performance';

/**
 * Enhanced animation hook that respects user preferences and theme settings
 */
export function useAnimations() {
  const { themeConfig } = useTheme();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState(() => 
    animationOptimizations.getOptimalSettings()
  );
  
  // Listen for reduced motion preference changes
  useEffect(() => {
    const cleanup = accessibilityUtils.onReducedMotionChange(setPrefersReducedMotion);
    setPrefersReducedMotion(accessibilityUtils.prefersReducedMotion());
    return cleanup;
  }, []);

  // Update device capabilities on mount
  useEffect(() => {
    setDeviceCapabilities(animationOptimizations.getOptimalSettings());
    AnimationMemoryManager.setMaxAnimations(deviceCapabilities.maxConcurrentAnimations);
  }, [deviceCapabilities.maxConcurrentAnimations]);
  
  const shouldAnimate = themeConfig.animations && 
                       !prefersReducedMotion && 
                       deviceCapabilities.enableComplexAnimations;
  
  /**
   * Get animation variants with reduced motion support
   */
  const getVariants = (variantName: keyof typeof ANIMATION_VARIANTS) => {
    if (!shouldAnimate) {
      return REDUCED_MOTION_VARIANTS[variantName] || REDUCED_MOTION_VARIANTS.fadeIn;
    }
    return ANIMATION_VARIANTS[variantName];
  };
  
  /**
   * Get transition configuration with duration and easing
   */
  const getTransition = (
    duration: keyof typeof ANIMATION_DURATIONS = 'normal',
    easing: keyof typeof ANIMATION_EASINGS = 'easeOut'
  ) => {
    if (!shouldAnimate) {
      return { duration: 0 };
    }
    
    const easingValue = ANIMATION_EASINGS[easing];
    
    if (typeof easingValue === 'object') {
      return {
        ...easingValue,
        duration: ANIMATION_DURATIONS[duration],
      };
    }
    
    return {
      duration: ANIMATION_DURATIONS[duration],
      ease: easingValue,
    };
  };
  
  /**
   * Get hover animation props for interactive elements with performance optimization
   */
  const getHoverProps = useCallback(() => {
    if (!shouldAnimate || !deviceCapabilities.enableComplexAnimations) {
      return {};
    }
    
    return {
      whileHover: "hover",
      whileTap: "tap",
      variants: ANIMATION_VARIANTS.buttonHover,
      transition: getTransition('fast'),
      style: deviceCapabilities.useGPUAcceleration ? {
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden' as const,
      } : undefined,
    };
  }, [shouldAnimate, deviceCapabilities]);
  
  /**
   * Get stagger animation props for lists
   */
  const getStaggerProps = (delay = 0.1) => {
    if (!shouldAnimate) {
      return {
        animate: {},
        transition: { duration: 0 },
      };
    }
    
    return {
      animate: "animate",
      transition: {
        staggerChildren: delay,
      },
    };
  };
  
  /**
   * Get entrance animation props for new elements with performance optimization
   */
  const getEntranceProps = useCallback((
    variant: keyof typeof ANIMATION_VARIANTS = 'fadeIn',
    delay = 0,
    animationId?: string
  ) => {
    const variants = getVariants(variant);
    
    // Check if we can start this animation
    if (animationId && !AnimationMemoryManager.canStartAnimation(animationId)) {
      return accessibilityUtils.getSafeAnimationProps({
        initial: "animate",
        animate: "animate",
        variants,
      });
    }

    const props = {
      initial: "initial",
      animate: "animate",
      exit: "exit",
      variants,
      transition: {
        ...getTransition(),
        delay: accessibilityUtils.getSafeAnimationDuration(delay),
      },
      onAnimationStart: animationId ? () => {
        AnimationMemoryManager.startAnimation(animationId);
      } : undefined,
      onAnimationComplete: animationId ? () => {
        AnimationMemoryManager.endAnimation(animationId);
      } : undefined,
    };

    return accessibilityUtils.getSafeAnimationProps(props);
  }, [shouldAnimate]);
  
  /**
   * Get loading animation props
   */
  const getLoadingProps = () => {
    if (!shouldAnimate) {
      return {};
    }
    
    return {
      animate: {
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      },
    };
  };
  
  /**
   * Get typing indicator animation props
   */
  const getTypingProps = (delay = 0) => {
    if (!shouldAnimate) {
      return {};
    }
    
    return {
      animate: {
        y: [0, -4, 0],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      },
    };
  };
  
  return {
    shouldAnimate,
    prefersReducedMotion,
    deviceCapabilities,
    getVariants,
    getTransition,
    getHoverProps,
    getStaggerProps,
    getEntranceProps,
    getLoadingProps,
    getTypingProps,
  };
}

/**
 * Hook for sidebar-specific animations
 */
export function useSidebarAnimations() {
  const { shouldAnimate, getTransition } = useAnimations();
  
  const getSidebarTransition = () => {
    return getTransition('normal', 'easeOut');
  };
  
  const getCollapseProps = (isCollapsed: boolean) => {
    if (!shouldAnimate) {
      return {
        style: { width: isCollapsed ? 64 : 256 },
      };
    }
    
    return {
      animate: { width: isCollapsed ? 64 : 256 },
      transition: getSidebarTransition(),
    };
  };
  
  const getContentFadeProps = (isCollapsed: boolean) => {
    if (!shouldAnimate) {
      return {
        style: { 
          opacity: isCollapsed ? 0 : 1,
          display: isCollapsed ? 'none' : 'block',
        },
      };
    }
    
    return {
      animate: { 
        opacity: isCollapsed ? 0 : 1,
        display: isCollapsed ? 'none' : 'block',
      },
      transition: {
        ...getSidebarTransition(),
        delay: isCollapsed ? 0 : 0.1,
      },
    };
  };
  
  return {
    getSidebarTransition,
    getCollapseProps,
    getContentFadeProps,
  };
}