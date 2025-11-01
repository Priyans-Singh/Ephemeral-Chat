import { Toaster as Sonner } from "sonner"
import { useEffect, useState } from "react"
import { notificationService } from "@/lib/notification-service"
import type { NotificationPrefs } from "@/lib/notification-service"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const [preferences, setPreferences] = useState<NotificationPrefs>(
    notificationService.getPreferences()
  );

  useEffect(() => {
    // Listen for preference changes
    const handleStorageChange = () => {
      setPreferences(notificationService.getPreferences());
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (in case preferences are updated in the same tab)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <Sonner
      className="toaster group"
      position={preferences.position}
      duration={preferences.duration}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }