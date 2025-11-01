import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { themeConfig } = useTheme();

  const containerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1
    }
  };

  const transition = {
    duration: themeConfig.animations ? 0.3 : 0,
    ease: [0.4, 0.0, 0.2, 1] as const
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        transition={transition}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  );
};