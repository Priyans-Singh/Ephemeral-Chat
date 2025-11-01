import { useTheme } from '@/contexts/ThemeContext';

export function useThemeAnimations() {
  const { themeConfig } = useTheme();
  
  const getAnimationProps = (baseProps: any) => {
    if (!themeConfig.animations) {
      return {
        ...baseProps,
        animate: baseProps.animate,
        transition: { duration: 0 },
      };
    }
    return baseProps;
  };

  const getTransitionProps = (duration = 0.2) => {
    if (!themeConfig.animations) {
      return { duration: 0 };
    }
    return { duration };
  };

  return {
    animationsEnabled: themeConfig.animations,
    getAnimationProps,
    getTransitionProps,
  };
}