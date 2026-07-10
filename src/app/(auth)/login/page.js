import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — ReelGenius',
  description: 'Access your ReelGenius dashboard to manage your content pipeline.',
};

export default function LoginPage() {
  return <LoginForm />;
}
