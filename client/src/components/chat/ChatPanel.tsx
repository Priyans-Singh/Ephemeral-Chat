import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Placeholder message data
const messages = [
  { id: '1', sender: 'Alice', text: 'Hey, how is it going?' },
  { id: '2', sender: 'You', text: 'Good! Just working on this chat app.' },
  { id: '3', sender: 'Alice', text: 'Awesome! Looks great.' },
];

export const ChatPanel = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold">Alice</h2>
      </header>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'You' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg p-3 max-w-xs ${
                  msg.sender === 'You'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <footer className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <Input type="text" placeholder="Type a message..." className="flex-1" />
          <Button type="submit">Send</Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatPanel;