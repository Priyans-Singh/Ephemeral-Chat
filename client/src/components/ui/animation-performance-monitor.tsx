import { useEffect, useState } from 'react';
import { AnimationPerformanceMonitor } from '@/lib/animation-performance';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnimationPerformanceDisplayProps {
  className?: string;
  showInProduction?: boolean;
}

/**
 * Development component to monitor animation performance
 * Only shows in development mode unless explicitly enabled
 */
export const AnimationPerformanceDisplay = ({ 
  className, 
  showInProduction = false 
}: AnimationPerformanceDisplayProps) => {
  const [fps, setFps] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (!isDevelopment && !showInProduction) {
      return;
    }

    setIsVisible(true);
    const monitor = AnimationPerformanceMonitor.getInstance();
    
    const cleanup = monitor.onFPSUpdate(setFps);
    monitor.startMonitoring();

    return () => {
      cleanup();
      monitor.stopMonitoring();
    };
  }, [showInProduction]);

  if (!isVisible) {
    return null;
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'bg-green-500';
    if (fps >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFPSStatus = (fps: number) => {
    if (fps >= 55) return 'Excellent';
    if (fps >= 30) return 'Good';
    return 'Poor';
  };

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg",
      className
    )}>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">FPS:</span>
        <Badge 
          variant="secondary" 
          className={cn("text-white", getFPSColor(fps))}
        >
          {fps}
        </Badge>
        <span className="text-xs text-muted-foreground">
          ({getFPSStatus(fps)})
        </span>
      </div>
    </div>
  );
};

/**
 * Hook to monitor animation performance in components
 */
export function useAnimationPerformance() {
  const [fps, setFps] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = () => {
    if (isMonitoring) return;
    
    const monitor = AnimationPerformanceMonitor.getInstance();
    const cleanup = monitor.onFPSUpdate(setFps);
    monitor.startMonitoring();
    setIsMonitoring(true);

    return () => {
      cleanup();
      monitor.stopMonitoring();
      setIsMonitoring(false);
    };
  };

  const stopMonitoring = () => {
    const monitor = AnimationPerformanceMonitor.getInstance();
    monitor.stopMonitoring();
    setIsMonitoring(false);
  };

  return {
    fps,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
  };
}