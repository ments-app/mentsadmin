import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function StartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session?.profile) redirect('/login');

  const { role, verification_status } = session.profile;

  if (role !== 'startup') {
    redirect(role === 'superadmin' ? '/dashboard' : '/facilitator/dashboard');
  }

  if (verification_status !== 'approved') {
    redirect('/pending-approval');
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        role="startup"
        displayName={session.profile.display_name ?? session.email}
      />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
