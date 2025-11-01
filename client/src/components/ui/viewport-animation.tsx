import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { animationOptimizations } from '@/lib/animation-performance';
import { ANIMATION_VARIANTS } from '@/lib/animation-config';

interface ViewportAnimationProps {
  children: React.ReactNode;
  variant?: keyof typeof ANIMATION_VARIANTS;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  delay?: number;
}

/**
 * Component that triggers animations when element enters viewport
 * Optimizes performance by only animating visible elements
 */
export const ViewportAnimation = ({
  children,
  variant = 'fadeIn',
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className,
  delay = 0,
}: ViewportAnimationProps) => {
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const { getVariants, shouldAnimate } = useAnimations();

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !shouldAnimate) return;

    const observer = animationOptimizations.createViewportAnimationObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (triggerOnce) {
              setHasTriggered(true);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, shouldAnimate]);

  // If animations are disabled, render children directly
  if (!shouldAnimate) {
    return <div ref={elementRef} className={className}>{children}</div>;
  }

  const variants = getVariants(variant);
  const shouldTriggerAnimation = triggerOnce ? hasTriggered : isInView;

  return (
    <motion.div
      ref={elementRef}
      className={className}
      initial="initial"
      animate={shouldTriggerAnimation ? "animate" : "initial"}
      variants={variants}
      transition={{
        duration: 0.3,
        delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Hook for viewport-based animation control
 */
export function useViewportAnimation(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = animationOptimizations.createViewportAnimationObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { elementRef, isInView };
}

/**
 * Staggered viewport animation for lists
 */
interface ViewportStaggerProps {
  children: React.ReactNode[];
  variant?: keyof typeof ANIMATION_VARIANTS;
  staggerDelay?: number;
  threshold?: number;
  className?: string;
}

export const ViewportStagger = ({
  children,
  variant = 'slideUp',
  staggerDelay = 0.1,
  threshold = 0.1,
  className,
}: ViewportStaggerProps) => {
  const { isInView, elementRef } = useViewportAnimation(threshold);
  const { getVariants, shouldAnimate } = useAnimations();

  if (!shouldAnimate) {
    return (
      <div ref={elementRef as any} className={className}>
        {children}
      </div>
    );
  }

  const variants = getVariants(variant);

  return (
    <motion.div
      ref={elementRef as any}
      className={className}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      transition={{
        staggerChildren: staggerDelay,
      }}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={variants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};