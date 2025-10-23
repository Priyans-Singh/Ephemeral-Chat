import React from 'react';
import { cn } from '@/lib/utils';

export const ChatLayout = ({
  sidebar,
  mainPanel,
  isCollapsed,
}: {
  sidebar: React.ReactNode;
  mainPanel: React.ReactNode;
  isCollapsed: boolean;
}) => {
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <aside className={cn(
        "border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-all duration-300 ease-in-out",
        isCollapsed ? 'w-20' : 'w-80'
      )}>
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden">{mainPanel}</main>
    </div>
  );
};