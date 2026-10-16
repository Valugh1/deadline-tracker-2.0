import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navbar';
import { getCurrentUserProfile } from '@/actions/auth';
import { AiChat } from '@/components/chat/ai-chat';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userProfile = await getCurrentUserProfile();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
        userProfile={userProfile}
      />
      <main className="flex-1">{children}</main>
      <AiChat userName={userProfile?.name || session.user.name || session.user.email?.split('@')[0] || 'Utente'} />
    </div>
  );
}
