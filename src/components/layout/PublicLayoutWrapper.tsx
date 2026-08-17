'use client';

import { usePathname } from 'next/navigation';
import FloatingNavbar from './FloatingNavbar';
import LuxuryFooter from './LuxuryFooter';
import Preloader from '@/components/ui/Preloader';

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname ? pathname.startsWith('/admin') : false;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Preloader />
      <FloatingNavbar />
      <main className="min-h-screen flex flex-col">
        {children}
      </main>
      <LuxuryFooter />
    </>
  );
}
