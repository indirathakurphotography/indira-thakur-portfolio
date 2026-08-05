'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { PolaroidImage } from '@/components/ui/PolaroidImage';
import { FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';

export default function LuxuryFooter() {
  const { config } = useSiteConfig();
  const [logoError, setLogoError] = useState(false);

  const footerData: any = config?.footer || {
    tagline: 'Fine Art Photography',
    description: "Photography for me is all about preserving emotions, celebrating families, documenting milestones, and creating timeless memories that people will treasure for generations.",
    email: 'photography@indirathakur.com',
    phone: '+91 9819620484',
    instagramUrl: 'https://instagram.com',
    facebookUrl: 'https://facebook.com',
    backgroundFooter: { url: '', alt: '' },
    logo: { url: '', alt: '' },
  };

  const brandData: any = config?.brand || {};

  const logoUrl = brandData?.logo?.url || footerData.logo?.url;
  const logoAlt = brandData?.logo?.alt || footerData.logo?.alt || 'Indira Thakur Photography Logo';

  const instagramUrl = brandData?.instagramUrl || footerData.instagramUrl || 'https://www.instagram.com/indirathakurphotography/';
  const facebookUrl = brandData?.facebookUrl || footerData.facebookUrl || '';
  const linkedinUrl = brandData?.linkedinUrl || '';

  const hasImage = (url?: string) => url && url.trim() !== '';

  const socialLinks = [
    { url: instagramUrl, icon: FaInstagram, label: 'Instagram' },
    ...(facebookUrl ? [{ url: facebookUrl, icon: FaFacebookF, label: 'Facebook' }] : []),
    ...(linkedinUrl ? [{ url: linkedinUrl, icon: FaLinkedinIn, label: 'LinkedIn' }] : []),
  ];

  return (
    <footer className="relative bg-[#2B2625] text-white/70 overflow-hidden border-t border-white/5">
      {hasImage(footerData.backgroundFooter?.url) && (
        <div className="absolute inset-0 pointer-events-none">
          <PolaroidImage
            src={footerData.backgroundFooter.url}
            alt={footerData.backgroundFooter.alt || ''}
            objectFit="cover"
            sizes="100vw"
            className="!w-full !h-full opacity-10 blur-xs"
            containerClassName="!w-full !h-full !absolute !inset-0"
          />
        </div>
      )}

      {/* Subtle Top Accent */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#C39E96]/40 to-transparent" />

      <div className="container-editorial py-24 md:py-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start">
            <Link href="/" className="mb-4 inline-block group">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt={logoAlt}
                  onError={() => setLogoError(true)}
                  loading="eager"
                  className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex flex-col">
                  <span className="font-serif text-3xl text-white tracking-tight">
                    {brandData?.siteName || 'Indira Thakur'}
                  </span>
                  <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.35em] mt-1">
                    {brandData?.tagline || 'FINE ART PHOTOGRAPHY'}
                  </span>
                </div>
              )}
            </Link>
            <p className="font-sans text-sm text-white/50 mt-2 max-w-md leading-relaxed">
              {footerData.description}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-[#2B2625] font-sans text-[11px] uppercase tracking-[0.2em] transition-all duration-500 rounded-sm"
              >
                <span>Book a Session</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="md:col-span-3" aria-label="Footer Navigation">
            <h4 className="font-mono text-[11px] text-[#C39E96]/80 uppercase tracking-[0.3em] mb-6">Explore</h4>
            <ul className="space-y-3.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Story' },
                { href: '/services', label: 'Services & Experience' },
                { href: '/gallery', label: 'Portfolio Gallery' },
                { href: '/testimonials', label: 'Client Praise' },
                { href: '/contact', label: 'Inquiries & Contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="font-sans text-xs text-white/50 hover:text-white transition-colors duration-300 py-1 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect */}
          <nav className="md:col-span-4" aria-label="Footer Contact Information">
            <h4 className="font-mono text-[11px] text-[#C39E96]/80 uppercase tracking-[0.3em] mb-6">Get In Touch</h4>
            <ul className="space-y-4 font-sans text-xs text-white/50">
              <li>
                <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">Direct Email</span>
                <a
                  href={`mailto:${footerData.email}`}
                  className="text-white/80 hover:text-[#C39E96] transition-colors duration-300"
                >
                  {footerData.email}
                </a>
              </li>
              <li>
                <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">Phone / WhatsApp</span>
                <a
                  href={`tel:${footerData.phone?.replace(/\s/g, '')}`}
                  className="text-white/80 hover:text-[#C39E96] transition-colors duration-300"
                >
                  {footerData.phone}
                </a>
              </li>
              {socialLinks.length > 0 && (
                <li className="pt-2">
                  <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-3">Social Journal</span>
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-[#C39E96]/60 hover:bg-[#C39E96]/10 transition-all duration-300 group"
                      >
                        <social.icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      </a>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </nav>
        </div>

        <div className="w-full h-px bg-white/10 mt-20 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-sans text-xs text-white/40">
            &copy; {new Date().getFullYear()} Indira Thakur Photography. All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            <span>Mumbai, India</span>
            <span>·</span>
            <Link href="/admin/login" className="hover:text-white/60 transition-colors">
              Client Portal / CMS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
