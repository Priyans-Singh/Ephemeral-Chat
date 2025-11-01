import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimations } from '@/hooks/use-animations';
import { TypingIndicator as AnimatedTypingDots } from '@/components/ui/loading-animations';

interface TypingUser {
  id: string;
  displayName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  className?: string;
}

const TypingDots = () => {
  const { shouldAnimate } = useAnimations();
  
  if (!shouldAnimate) {
    return (
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
        <div className="w-2 h-2 bg-muted-foreground rounded-full" />
      </div>
    );
  }
  
  return <AnimatedTypingDots />;
};

export const TypingIndicator = ({ typingUsers, className }: TypingIndicatorProps) => {
  const { getEntranceProps, shouldAnimate } = useAnimations();
  
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].displayName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].displayName} and ${typingUsers[1].displayName} are typing`;
    } else {
      return `${typingUsers[0].displayName} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={cn("flex items-center gap-3 px-4 py-2", className)}
        {...getEntranceProps('slideUp')}
      >
        {/* Avatar(s) */}
        <div className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user, index) => (
            <motion.div
              key={user.id}
              initial={shouldAnimate ? { scale: 0, x: -20 } : { scale: 1, x: 0 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              className="relative"
            >
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarImage
                  src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.displayName}`}
                  alt={user.displayName}
                />
                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {user.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Typing indicator pulse */}
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"
                animate={shouldAnimate ? {
                  scale: [1, 1.2, 1],
                } : {}}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Typing message bubble */}
        <motion.div
          initial={shouldAnimate ? { scale: 0.9, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 flex items-center gap-3"
        >
          <TypingDots />
          <span className="text-sm text-muted-foreground font-medium">
            {getTypingText()}
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;