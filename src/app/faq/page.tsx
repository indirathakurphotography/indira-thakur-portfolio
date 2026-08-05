import EditorialFAQ from '@/components/sections/EditorialFAQ';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questions & Answers | Indira Thakur Photography',
  description: 'Frequently asked questions regarding sessions, studio locations, and wardrobe.',
};

export default function FAQPage() {
  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <EditorialFAQ />
    </div>
  );
}
