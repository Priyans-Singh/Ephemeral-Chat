import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeConfig {
  mode: Theme;
  accentColor: string;
  animations: boolean;
  performanceMode: 'auto' | 'high' | 'low';
  reducedMotion: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
  setAnimations: (enabled: boolean) => void;
  setPerformanceMode: (mode: 'auto' | 'high' | 'low') => void;
  setReducedMotion: (enabled: boolean) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'system',
  accentColor: 'default',
  animations: true,
  performanceMode: 'auto',
  reducedMotion: false,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const stored = localStorage.getItem('theme-config');
    return stored ? JSON.parse(stored) : DEFAULT_THEME_CONFIG;
  });

  const [theme, setThemeState] = useState<Theme>(themeConfig.mode);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    let effectiveTheme = theme;
    
    // Handle system theme
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Apply theme class
    root.classList.add(effectiveTheme);
    
    // Apply animations preference
    if (!themeConfig.animations) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Apply accent color if not default
    if (themeConfig.accentColor !== 'default') {
      root.style.setProperty('--accent-color', themeConfig.accentColor);
    }
  }, [theme, themeConfig]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Persist theme config to localStorage
  useEffect(() => {
    localStorage.setItem('theme-config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setThemeConfig(prev => ({ ...prev, mode: newTheme }));
  };

  const setAccentColor = (color: string) => {
    setThemeConfig(prev => ({ ...prev, accentColor: color }));
  };

  const setAnimations = (enabled: boolean) => {
    setThemeConfig(prev => ({ ...prev, animations: enabled }));
  };

  const setPerformanceMode = (mode: 'auto' | 'high' | 'low') => {
    setThemeConfig(prev => ({ ...prev, performanceMode: mode }));
  };

  const setReducedMotion = (enabled: boolean) => {
    setThemeConfig(prev => ({ ...prev, reducedMotion: enabled }));
  };

  const toggleTheme = () => {
    const currentEffectiveTheme = theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    
    setTheme(currentEffectiveTheme === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    theme,
    themeConfig,
    setTheme,
    setAccentColor,
    setAnimations,
    setPerformanceMode,
    setReducedMotion,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}