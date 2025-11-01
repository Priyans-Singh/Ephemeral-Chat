import { motion } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { cn } from '@/lib/utils';

/**
 * Animated loading spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const { shouldAnimate } = useAnimations();
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  if (!shouldAnimate) {
    return (
      <div className={cn(
        "border-2 border-muted border-t-primary rounded-full",
        sizeClasses[size],
        className
      )} />
    );
  }
  
  return (
    <motion.div
      className={cn(
        "border-2 border-muted border-t-primary rounded-full",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

/**
 * Animated typing indicator dots
 */
export const TypingIndicator = ({ className }: { className?: string }) => {
  const { getTypingProps, shouldAnimate } = useAnimations();
  
  if (!shouldAnimate) {
    return (
      <div className={cn("flex space-x-1", className)}>
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
      </div>
    );
  }
  
  return (
    <div className={cn("flex space-x-1", className)}>
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        {...getTypingProps(0)}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        {...getTypingProps(0.2)}
      />
      <motion.div
        className="w-2 h-2 bg-muted-foreground rounded-full"
        {...getTypingProps(0.4)}
      />
    </div>
  );
};

/**
 * Animated pulse loader for content placeholders
 */
interface PulseLoaderProps {
  className?: string;
  lines?: number;
}

export const PulseLoader = ({ className, lines = 3 }: PulseLoaderProps) => {
  const { getLoadingProps, shouldAnimate } = useAnimations();
  
  const baseClass = "h-4 bg-muted rounded animate-pulse";
  
  if (!shouldAnimate) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={baseClass} />
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-muted rounded"
          {...getLoadingProps()}
          transition={{
            ...getLoadingProps().animate?.transition,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Animated skeleton loader for avatars
 */
export const SkeletonAvatar = ({ className }: { className?: string }) => {
  const { getLoadingProps, shouldAnimate } = useAnimations();
  
  if (!shouldAnimate) {
    return <div className={cn("w-8 h-8 bg-muted rounded-full animate-pulse", className)} />;
  }
  
  return (
    <motion.div
      className={cn("w-8 h-8 bg-muted rounded-full", className)}
      {...getLoadingProps()}
    />
  );
};

/**
 * Animated progress bar
 */
interface AnimatedProgressProps {
  value: number;
  className?: string;
}

export const AnimatedProgress = ({ value, className }: AnimatedProgressProps) => {
  const { shouldAnimate } = useAnimations();
  
  return (
    <div className={cn("w-full bg-muted rounded-full h-2", className)}>
      <motion.div
        className="bg-primary h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={shouldAnimate ? { duration: 0.5, ease: "easeOut" } : { duration: 0 }}
      />
    </div>
  );
};