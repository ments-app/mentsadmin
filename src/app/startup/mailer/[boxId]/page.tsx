'use client';

import { useParams } from 'next/navigation';
import MailBoxDetail from '@/components/mailer/MailBoxDetail';

export default function StartupMailBoxPage() {
  const { boxId } = useParams<{ boxId: string }>();
  return <MailBoxDetail boxId={boxId} role="startup" />;
}
