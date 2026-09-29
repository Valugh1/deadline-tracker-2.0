import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import RegisterForm from '@/components/auth/register-form';

export const metadata = {
  title: 'Registrati — Kairon',
  description: 'Crea un account Kairon per tracciare le tue scadenze e attività',
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/board');
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
      <RegisterForm />
    </div>
  );
}
