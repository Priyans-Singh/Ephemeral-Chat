import React from 'react';

export const ChatLayout = ({
  sidebar,
  mainPanel,
}: {
  sidebar: React.ReactNode;
  mainPanel: React.ReactNode;
}) => {
  return (
    <div className="flex h-screen w-full bg-gray-100 dark:bg-gray-900">
      <aside className="w-80 border-r border-gray-200 dark:border-gray-800 p-4">
        {sidebar}
      </aside>
      <main className="flex-1 flex flex-col">{mainPanel}</main>
    </div>
  );
};