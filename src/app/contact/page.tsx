import EditorialContact from '@/components/sections/EditorialContact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inquire & Contact | Indira Thakur Photography',
  description: 'Inquire about reserving your fine art photography session with Indira Thakur.',
};

export default function ContactPage() {
  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <EditorialContact />
    </div>
  );
}
