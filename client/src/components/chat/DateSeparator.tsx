import { format, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DateSeparatorProps {
  date: Date;
  className?: string;
}

const formatDateSeparator = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
};

export const DateSeparator = ({ date, className }: DateSeparatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex justify-center my-6", className)}
    >
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 py-1 text-xs font-medium text-muted-foreground rounded-full border border-border/50 shadow-sm">
            {formatDateSeparator(date)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default DateSeparator;