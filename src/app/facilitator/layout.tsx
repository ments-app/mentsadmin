import Sidebar from '@/components/Sidebar';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function FacilitatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  if (!session?.profile) redirect('/login');

  const { role, verification_status } = session.profile;

  if (role !== 'facilitator') {
    redirect(role === 'superadmin' ? '/dashboard' : '/startup/dashboard');
  }

  if (verification_status !== 'approved') {
    redirect('/pending-verification');
  }

  const fp = session.facilitatorProfile;

  return (
    <div className="flex h-screen">
      <Sidebar
        role="facilitator"
        displayName={session.profile.display_name ?? session.email}
        orgName={fp?.organisation_name}
      />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  );
}
