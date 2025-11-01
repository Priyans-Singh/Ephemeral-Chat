import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

interface AuthFormContainerProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export const AuthFormContainer = ({
  initialMode = 'login',
  onSuccess
}: AuthFormContainerProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const switchToLogin = () => setMode('login');
  const switchToSignup = () => setMode('signup');

  const formVariants = {
    initial: { opacity: 0, x: mode === 'login' ? -20 : 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: mode === 'login' ? 20 : -20 },
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Enter your credentials to access your account'
            : 'Enter your information to create a new account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            variants={formVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {mode === 'login' ? (
              <LoginForm
                onSuccess={onSuccess}
                onSwitchToSignup={switchToSignup}
              />
            ) : (
              <SignupForm
                onSuccess={onSuccess}
                onSwitchToLogin={switchToLogin}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};