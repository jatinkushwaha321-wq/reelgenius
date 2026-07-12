import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — NIVO',
  description: 'Access your NIVO dashboard to manage your content pipeline.',
};

export default function LoginPage() {
  return <LoginForm />;
}
