import { useState } from 'react';
import { notificationService, type NotificationPrefs } from '@/lib/notification-service';
import { Button } from './button';
import { Label } from './label';
import { Switch } from './switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './select';
import { Slider } from './slider';
import { Bell, Volume2, VolumeX } from 'lucide-react';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

export const NotificationPreferencesComponent = ({ onClose }: NotificationPreferencesProps) => {
  const [preferences, setPreferences] = useState<NotificationPrefs>(
    notificationService.getPreferences()
  );

  const handlePreferenceChange = (updates: Partial<NotificationPrefs>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    notificationService.updatePreferences(updates);
  };

  const handleTypeToggle = (type: keyof NotificationPrefs['types'], enabled: boolean) => {
    const newTypes = { ...preferences.types, [type]: enabled };
    handlePreferenceChange({ types: newTypes });
  };

  const testNotification = () => {
    notificationService.info('This is a test notification!', {
      showIcon: true,
      action: {
        label: 'Got it',
        onClick: () => {},
      },
    });
  };

  const positionOptions = [
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ] as const;

  return (
    <div className="w-full max-w-md p-6 bg-background border rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how and when you receive notifications
        </p>
      </div>
      <div className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Turn all notifications on or off
            </p>
          </div>
          <Switch
            checked={preferences.enabled}
            onCheckedChange={(enabled) => handlePreferenceChange({ enabled })}
          />
        </div>

        {preferences.enabled && (
          <>
            {/* Notification types */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Notification Types</Label>
              <div className="space-y-2">
                {Object.entries(preferences.types).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label className="capitalize">{type}</Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        handleTypeToggle(type as keyof NotificationPrefs['types'], checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Position</Label>
              <Select
                value={preferences.position}
                onValueChange={(position: NotificationPrefs['position']) =>
                  handlePreferenceChange({ position })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {positionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Duration</Label>
                <span className="text-sm text-muted-foreground">
                  {preferences.duration / 1000}s
                </span>
              </div>
              <Slider
                value={[preferences.duration]}
                onValueChange={([duration]) => handlePreferenceChange({ duration })}
                min={1000}
                max={10000}
                step={500}
                className="w-full"
              />
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.sound ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <Label className="text-base font-medium">Sound</Label>
              </div>
              <Switch
                checked={preferences.sound}
                onCheckedChange={(sound) => handlePreferenceChange({ sound })}
              />
            </div>

            {/* Test button */}
            <Button
              onClick={testNotification}
              variant="outline"
              className="w-full"
            >
              Test Notification
            </Button>
          </>
        )}

        {onClose && (
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        )}
      </div>
    </div>
  );
};