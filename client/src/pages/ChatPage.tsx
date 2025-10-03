import { ChatLayout } from "@/components/chat/ChatLayout";
import ChatPanel from "@/components/chat/ChatPanel";
import UserSidebar from "@/components/chat/UserSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const ChatPage = () => {
  const { logout } = useAuth();

  return (
    <div className="relative h-screen">
      <ChatLayout
        sidebar={<UserSidebar />}
        mainPanel={<ChatPanel />}
      />
      {/* Keep the logout button for now, styled to be in the top right */}
      <div className="absolute top-4 right-4">
        <Button onClick={logout} variant="destructive">
          Logout
        </Button>
      </div>
    </div>
  );
};