import { AuthLayout } from '@/components/layout/AuthLayout';
import { AuthFormContainer } from '@/components/auth/AuthFormContainer';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/chat');
  };

  return (
    <AuthLayout>
      <AuthFormContainer 
        initialMode="login"
        onSuccess={handleSuccess}
      />
    </AuthLayout>
  );
};