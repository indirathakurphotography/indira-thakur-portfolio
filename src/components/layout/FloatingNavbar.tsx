'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();
  const { config } = useSiteConfig();

  const brand = config?.brand;
  const logoUrl = brand?.logo?.url || config?.footer?.logo?.url;

  const isHome = pathname === '/';
  const isDarkTop = isHome && !scrolled && !mobileMenuOpen;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/films', label: 'Films' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/contact', label: 'Contact' },
  ];

  const scrollToContact = useCallback(() => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/contact';
    }
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          mobileMenuOpen
            ? 'bg-[#1C1817] py-4 border-b border-white/10'
            : scrolled
            ? 'py-3.5 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-[#E7DDD2]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : isDarkTop
            ? 'py-5 sm:py-6 md:py-8 bg-gradient-to-b from-[#151211]/90 via-[#151211]/40 to-transparent'
            : 'py-5 sm:py-6 md:py-8 bg-[#FAF6F3]/80 backdrop-blur-md border-b border-[#E7DDD2]/40'
        }`}
      >
        <div className="max-w-[1720px] mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20">
          <div className="flex items-center justify-between gap-6 lg:gap-12">
            {/* Brand Logo Container (Adaptive, Uncropped) */}
            <Link
              href="/"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="group flex items-center shrink-0 py-1 pl-1 cursor-pointer"
              aria-label="Indira Thakur Photography"
            >
              {logoUrl && !logoError ? (
                <div className="relative flex items-center justify-start overflow-visible p-1">
                  <img
                    src={logoUrl}
                    alt={brand?.logo?.alt || 'Indira Thakur Photography Logo'}
                    onError={() => setLogoError(true)}
                    loading="eager"
                    className={`w-auto object-contain transition-all duration-300 ${
                      scrolled
                        ? 'h-7 sm:h-8 md:h-9 max-h-9 max-w-[160px] sm:max-w-[200px]'
                        : 'h-8 sm:h-10 md:h-12 lg:h-14 max-h-14 max-w-[200px] sm:max-w-[260px] md:max-w-[320px]'
                    }`}
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <span
                    className={`font-serif text-2xl sm:text-3xl lg:text-3xl tracking-tight leading-none transition-colors duration-300 ${
                      mobileMenuOpen || isDarkTop ? 'text-white group-hover:text-[#C39E96]' : 'text-[#2B2625] group-hover:text-[#C39E96]'
                    }`}
                  >
                    Indira Thakur
                  </span>
                  <span
                    className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.35em] mt-1.5 transition-colors duration-300 ${
                      mobileMenuOpen || isDarkTop ? 'text-white/70' : 'text-[#7C706D]/70'
                    }`}
                  >
                    Fine Art Photography
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="desktop-nav hidden md:flex items-center justify-center gap-6 lg:gap-9 xl:gap-11">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative font-sans text-[10px] lg:text-[11px] uppercase tracking-[0.2em] transition-all duration-300 py-2 whitespace-nowrap group ${
                      isDarkTop
                        ? isActive
                          ? 'text-white font-medium'
                          : 'text-white/80 hover:text-white'
                        : isActive
                        ? 'text-[#2B2625] font-medium'
                        : 'text-[#7C706D] hover:text-[#2B2625]'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-[#C39E96] transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-1/2'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Detached CTA & Mobile Toggle */}
            <div className="flex items-center justify-end gap-5 shrink-0">
              {isHome ? (
                <button
                  onClick={scrollToContact}
                  className={`desktop-cta hidden md:inline-flex items-center justify-center px-5 py-2.5 lg:px-7 lg:py-3 font-sans text-[10px] lg:text-[11px] uppercase tracking-[0.22em] transition-all duration-300 shadow-sm ${
                    isDarkTop
                      ? 'bg-white text-[#2B2625] hover:bg-[#FAF6F3] font-medium'
                      : 'bg-[#2B2625] text-white hover:bg-[#3D3534] font-medium'
                  }`}
                >
                  Contact
                </button>
              ) : (
                <Link
                  href="/contact"
                  className={`desktop-cta hidden md:inline-flex items-center justify-center px-5 py-2.5 lg:px-7 lg:py-3 font-sans text-[10px] lg:text-[11px] uppercase tracking-[0.22em] transition-all duration-300 shadow-sm ${
                    isDarkTop
                      ? 'bg-white text-[#2B2625] hover:bg-[#FAF6F3] font-medium'
                      : 'bg-[#2B2625] text-white hover:bg-[#3D3534] font-medium'
                  }`}
                >
                  Contact
                </Link>
              )}

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className={`mobile-hamburger md:hidden p-2 transition-colors relative z-50 ${
                  mobileMenuOpen || isDarkTop ? 'text-white hover:text-[#C39E96]' : 'text-[#2B2625] hover:text-[#C39E96]'
                }`}
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              >
                <div className="w-6 h-5 flex flex-col justify-between items-center relative">
                  <span
                    className={`w-6 h-0.5 bg-current transition-all duration-300 transform origin-center ${
                      mobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                  />
                  <span
                    className={`w-6 h-0.5 bg-current transition-all duration-300 ${
                      mobileMenuOpen ? 'opacity-0' : ''
                    }`}
                  />
                  <span
                    className={`w-6 h-0.5 bg-current transition-all duration-300 transform origin-center ${
                      mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#1C1817] text-white flex flex-col justify-between px-8 pt-32 pb-12 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-center gap-7 my-auto text-center">
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-serif text-3xl sm:text-4xl transition-all duration-300 italic tracking-wide ${
                        isActive
                          ? 'text-[#C39E96] font-normal underline decoration-[#C39E96]/40 underline-offset-8'
                          : 'text-white/90 hover:text-[#C39E96]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="mt-6"
              >
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block px-9 py-4 bg-white text-[#2B2625] font-sans text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-[#FAF6F3] transition-colors shadow-lg"
                >
                  Book Session
                </Link>
              </motion.div>
            </div>

            <div className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/40 border-t border-white/10 pt-6 mt-8">
              Indira Thakur Fine Art Photography · Bangalore
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
