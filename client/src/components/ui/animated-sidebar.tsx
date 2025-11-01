import { motion } from 'framer-motion';
import { useSidebarAnimations } from '@/hooks/use-animations';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface AnimatedSidebarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Animated sidebar wrapper with smooth collapse/expand transitions
 */
export const AnimatedSidebar = ({ children, className }: AnimatedSidebarProps) => {
  const { isCollapsed } = useSidebar();
  const { getCollapseProps } = useSidebarAnimations();
  
  return (
    <motion.div
      className={cn(
        "border-r flex flex-col bg-background transition-all duration-300",
        className
      )}
      {...getCollapseProps(isCollapsed)}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated sidebar content that fades in/out based on collapse state
 */
interface AnimatedSidebarContentProps {
  children: React.ReactNode;
  className?: string;
  showWhenCollapsed?: boolean;
}

export const AnimatedSidebarContent = ({ 
  children, 
  className,
  showWhenCollapsed = false 
}: AnimatedSidebarContentProps) => {
  const { isCollapsed } = useSidebar();
  const { getContentFadeProps } = useSidebarAnimations();
  
  // If content should show when collapsed, don't animate it
  if (showWhenCollapsed) {
    return <div className={cn(className)}>{children}</div>;
  }
  
  return (
    <motion.div
      className={cn(className)}
      {...getContentFadeProps(isCollapsed)}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated sidebar item with hover effects
 */
interface AnimatedSidebarItemProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  hasUnread?: boolean;
  onClick?: () => void;
}

export const AnimatedSidebarItem = ({
  children,
  className,
  isActive = false,
  hasUnread = false,
  onClick,
}: AnimatedSidebarItemProps) => {
  const { getSidebarTransition } = useSidebarAnimations();
  
  return (
    <motion.div
      className={cn(
        "cursor-pointer transition-all duration-200",
        isActive && "bg-accent",
        hasUnread && "bg-blue-50 dark:bg-blue-950",
        className
      )}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};