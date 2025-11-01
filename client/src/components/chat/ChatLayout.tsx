import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

export const ChatLayout = ({
  sidebar,
  mainPanel,
  isCollapsed,
}: {
  sidebar: React.ReactNode;
  mainPanel: React.ReactNode;
  isCollapsed: boolean;
}) => {
  const { themeConfig } = useTheme();

  const sidebarVariants = {
    expanded: { 
      width: '320px'
    },
    collapsed: { 
      width: '80px'
    }
  };

  const transition = {
    duration: themeConfig.animations ? 0.3 : 0,
    ease: [0.4, 0.0, 0.2, 1] as const
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <motion.aside 
        className={cn(
          "border-r border-border flex flex-col h-full bg-sidebar",
          "shadow-sm"
        )}
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        initial={false}
        transition={transition}
      >
        {sidebar}
      </motion.aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {mainPanel}
      </main>
    </div>
  );
};