import { motion } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { forwardRef } from 'react';

/**
 * Animated form container with staggered field animations
 */
interface AnimatedFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export const AnimatedForm = ({ children, className, onSubmit }: AnimatedFormProps) => {
  const { getStaggerProps } = useAnimations();
  
  return (
    <motion.form
      className={cn("space-y-4", className)}
      onSubmit={onSubmit}
      {...getStaggerProps(0.1)}
    >
      {children}
    </motion.form>
  );
};

/**
 * Animated form field with focus and validation animations
 */
interface AnimatedFormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
}

export const AnimatedFormField = ({ children, className, error }: AnimatedFormFieldProps) => {
  const { getVariants, shouldAnimate } = useAnimations();
  
  return (
    <motion.div
      className={cn("space-y-2", className)}
      variants={getVariants('slideUp')}
    >
      {children}
      {error && (
        <motion.p
          className="text-sm text-destructive"
          initial={shouldAnimate ? { opacity: 0, y: -10 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
};

/**
 * Enhanced input with focus animations
 */
interface AnimatedInputProps extends React.ComponentProps<typeof Input> {
  label?: string;
  error?: string;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const { shouldAnimate } = useAnimations();
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <motion.div
          whileFocus={shouldAnimate ? { scale: 1.02 } : {}}
          transition={{ duration: 0.15 }}
        >
          <Input
            ref={ref}
            className={cn(
              "transition-all duration-200",
              error && "border-destructive focus:border-destructive",
              className
            )}
            {...props}
          />
        </motion.div>
        {error && (
          <motion.p
            className="text-sm text-destructive"
            initial={shouldAnimate ? { opacity: 0, x: -10 } : { opacity: 1 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";

/**
 * Animated submit button with loading state
 */
interface AnimatedSubmitButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
}

export const AnimatedSubmitButton = ({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled,
  className,
  ...props
}: AnimatedSubmitButtonProps) => {
  const { shouldAnimate } = useAnimations();
  
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className={cn("w-full", className)}
      animated={shouldAnimate}
      {...props}
    >
      {loading && shouldAnimate && (
        <motion.div
          className="mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        </motion.div>
      )}
      {loading ? loadingText : children}
    </Button>
  );
};

/**
 * Animated form success/error message
 */
interface AnimatedFormMessageProps {
  type: 'success' | 'error' | 'info';
  message: string;
  className?: string;
}

export const AnimatedFormMessage = ({ type, message, className }: AnimatedFormMessageProps) => {
  const { getEntranceProps } = useAnimations();
  
  const typeStyles = {
    success: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800',
    error: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
    info: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800',
  };
  
  return (
    <motion.div
      className={cn(
        "p-3 rounded-md border text-sm",
        typeStyles[type],
        className
      )}
      {...getEntranceProps('slideDown')}
    >
      {message}
    </motion.div>
  );
};