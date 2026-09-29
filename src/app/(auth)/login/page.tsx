import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/login-form';

export const metadata = {
  title: 'Accedi — Kairon',
  description: 'Accedi al tuo account Kairon per gestire le tue scadenze e attività',
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/board');
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
      <LoginForm />
    </div>
  );
}
