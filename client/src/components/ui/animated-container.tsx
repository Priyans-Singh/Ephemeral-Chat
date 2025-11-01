import { motion, type HTMLMotionProps } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { ANIMATION_VARIANTS } from '@/lib/animation-config';
import { cn } from '@/lib/utils';

interface AnimatedContainerProps extends Omit<HTMLMotionProps<"div">, 'variants'> {
  variant?: keyof typeof ANIMATION_VARIANTS;
  delay?: number;
  stagger?: boolean;
  staggerDelay?: number;
  children: React.ReactNode;
}

/**
 * Reusable animated container component
 * Handles entrance animations with reduced motion support
 */
export const AnimatedContainer = ({
  variant = 'fadeIn',
  delay = 0,
  stagger = false,
  staggerDelay = 0.1,
  className,
  children,
  ...props
}: AnimatedContainerProps) => {
  const { getEntranceProps, getStaggerProps } = useAnimations();
  
  const animationProps = stagger 
    ? getStaggerProps(staggerDelay)
    : getEntranceProps(variant, delay);
  
  return (
    <motion.div
      className={cn(className)}
      {...animationProps}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated list item component for staggered animations
 */
export const AnimatedListItem = ({
  variant = 'slideUp',
  className,
  children,
  ...props
}: Omit<AnimatedContainerProps, 'stagger' | 'staggerDelay'>) => {
  const { getVariants } = useAnimations();
  
  return (
    <motion.div
      className={cn(className)}
      variants={getVariants(variant)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated button wrapper with hover effects
 */
interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  disabled?: boolean;
}

export const AnimatedButton = ({
  className,
  children,
  disabled = false,
  ...props
}: AnimatedButtonProps) => {
  const { getHoverProps } = useAnimations();
  
  const hoverProps = disabled ? {} : getHoverProps();
  
  return (
    <motion.button
      className={cn(className)}
      {...hoverProps}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * Animated notification container
 */
export const AnimatedNotification = ({
  className,
  children,
  ...props
}: Omit<AnimatedContainerProps, 'variant'>) => {
  const { getEntranceProps } = useAnimations();
  
  return (
    <motion.div
      className={cn(className)}
      {...getEntranceProps('notificationSlide')}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated message container
 */
export const AnimatedMessage = ({
  className,
  children,
  delay = 0,
  ...props
}: Omit<AnimatedContainerProps, 'variant'>) => {
  const { getEntranceProps } = useAnimations();
  
  return (
    <motion.div
      className={cn(className)}
      {...getEntranceProps('messageEnter', delay)}
      {...props}
    >
      {children}
    </motion.div>
  );
};