'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube, FaWhatsapp, FaXTwitter, FaPinterestP } from 'react-icons/fa6';

export default function LuxuryFooter() {
  const { config } = useSiteConfig();
  const [logoError, setLogoError] = useState(false);

  const brandData: any = config?.brand || {};
  const footerData: any = config?.footer || {};
  const socials = brandData?.socials || {};

  const email = brandData?.contactEmail || brandData?.email || footerData.email || 'photography@indirathakur.com';
  const phone = brandData?.contactPhone || brandData?.phone || footerData.phone || '+91 98196 20484';
  const location = brandData?.contactLocation || brandData?.location || footerData.location || 'Tilak Nagar, Chembur, Mumbai, Maharashtra, India';
  const tagline = brandData?.tagline || footerData.tagline || 'FINE ART PHOTOGRAPHY';
  const siteName = brandData?.name || brandData?.siteName || 'Indira Thakur Photography';
  const copyright = brandData?.copyright || `© ${new Date().getFullYear()} ${siteName}. All Rights Reserved.`;
  const description = footerData.description || brandData?.galleryIntro || "Photography for me is all about preserving emotions, celebrating families, documenting milestones, and creating timeless memories that people will treasure for generations.";

  const logoUrl = brandData?.logoUrl || (typeof brandData?.logo === 'string' ? brandData?.logo : brandData?.logo?.url) || footerData.logo?.url;
  const logoAlt = brandData?.logo?.alt || footerData.logo?.alt || `${siteName} Logo`;

  const instagramUrl = socials.instagram || brandData?.instagramUrl || footerData.instagramUrl || 'https://www.instagram.com/indirathakurphotography/';
  const whatsappUrl = socials.whatsapp || brandData?.whatsappUrl || '';
  const youtubeUrl = socials.youtube || brandData?.youtubeUrl || footerData.youtubeUrl || '';
  const facebookUrl = socials.facebook || brandData?.facebookUrl || footerData.facebookUrl || '';
  const linkedinUrl = socials.linkedin || brandData?.linkedinUrl || '';
  const twitterUrl = socials.twitter || socials.x || brandData?.twitterUrl || '';
  const pinterestUrl = socials.pinterest || brandData?.pinterestUrl || '';

  const socialLinks = [
    ...(instagramUrl ? [{ url: instagramUrl, icon: FaInstagram, label: 'Instagram' }] : []),
    ...(whatsappUrl ? [{ url: whatsappUrl.startsWith('http') ? whatsappUrl : `https://wa.me/${whatsappUrl.replace(/[^\d]/g, '')}`, icon: FaWhatsapp, label: 'WhatsApp' }] : []),
    ...(youtubeUrl ? [{ url: youtubeUrl, icon: FaYoutube, label: 'YouTube' }] : []),
    ...(facebookUrl ? [{ url: facebookUrl, icon: FaFacebookF, label: 'Facebook' }] : []),
    ...(linkedinUrl ? [{ url: linkedinUrl, icon: FaLinkedinIn, label: 'LinkedIn' }] : []),
    ...(twitterUrl ? [{ url: twitterUrl, icon: FaXTwitter, label: 'Twitter/X' }] : []),
    ...(pinterestUrl ? [{ url: pinterestUrl, icon: FaPinterestP, label: 'Pinterest' }] : []),
  ];

  return (
    <footer className="relative bg-[#2B2625] text-white/70 overflow-hidden border-t border-white/5">
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
                    {siteName}
                  </span>
                  <span className="font-mono text-[9px] text-[#C39E96] uppercase tracking-[0.35em] mt-1">
                    {tagline}
                  </span>
                </div>
              )}
            </Link>

            <p className="font-sans text-sm text-white/50 mt-2 max-w-md leading-relaxed">
              {description}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href={footerData.bookButtonLink || '/contact'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-[#2B2625] font-sans text-[11px] uppercase tracking-[0.2em] transition-all duration-500 rounded-sm"
              >
                <span>{footerData.bookButtonText || 'Book a Session'}</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="md:col-span-3" aria-label="Footer Navigation">
            <h4 className="font-mono text-[11px] text-[#C39E96]/80 uppercase tracking-[0.3em] mb-6">
              Navigation
            </h4>
            <ul className="space-y-3.5">
              {[
                { href: '/', label: 'Home' },
                { href: '/about', label: 'About Story' },
                { href: '/services', label: 'Services & Experience' },
                { href: '/films', label: 'Cinematic Films' },
                { href: '/testimonials', label: 'Client Feedback' },
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
            <h4 className="font-mono text-[11px] text-[#C39E96]/80 uppercase tracking-[0.3em] mb-6">
              Get In Touch
            </h4>
            <ul className="space-y-4 font-sans text-xs text-white/50">
              <li>
                <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">
                  Direct Email
                </span>
                <a
                  href={`mailto:${email}`}
                  className="text-white/80 hover:text-[#C39E96] transition-colors duration-300"
                >
                  {email}
                </a>
              </li>
              <li>
                <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-1">
                  Phone / WhatsApp
                </span>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-white/80 hover:text-[#C39E96] transition-colors duration-300"
                >
                  {phone}
                </a>
              </li>
              {socialLinks.length > 0 && (
                <li className="pt-2">
                  <span className="block text-[10px] uppercase font-mono text-white/30 tracking-[0.2em] mb-3">
                    Social Journal
                  </span>
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

        {/* Footer SEO & Location Keywords */}
        {((Array.isArray(footerData.keywords) && footerData.keywords.length > 0) || (Array.isArray(brandData.keywords) && brandData.keywords.length > 0)) && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-[#C39E96]/80 mb-3">
              Specialized Services & Coverage
            </span>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(footerData.keywords) && footerData.keywords.length > 0 ? footerData.keywords : brandData.keywords).map((kw: string, i: number) => (
                <span
                  key={i}
                  className="font-sans text-[11px] text-white/50 bg-white/5 hover:bg-white/10 hover:text-white/80 px-2.5 py-1 rounded border border-white/10 transition-colors"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="w-full h-px bg-white/10 mt-12 mb-8" />

        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="font-serif text-sm text-white/90 font-medium tracking-wide">
              {copyright}
            </p>
            <span className="inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] bg-white/5 px-3 py-1 rounded-xs border border-white/10 self-start md:self-auto">
              {siteName} is a Registered Entity.
            </span>
          </div>
          <p className="font-sans text-xs text-white/50 leading-relaxed max-w-4xl">
            All photographs, films, and creative works displayed on this website are protected by copyright. Unauthorized copying, downloading, reproduction, distribution, or commercial use is strictly prohibited.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-white/5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            <span>{location}</span>
            <span>{siteName}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
