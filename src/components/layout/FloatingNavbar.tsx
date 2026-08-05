'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowUpRight } from 'react-icons/hi2';

export default function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();
  const { config } = useSiteConfig();

  const brand = config?.brand;
  const getUrl = (val: any) => (typeof val === 'string' ? val : (typeof val === 'object' && typeof val?.url === 'string' ? val.url : ''));
  const logoUrl = getUrl(brand?.logo) || getUrl(config?.footer?.logo);

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

  // Main middle nav links (Contact moved to dedicated primary CTA on far right)
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/films', label: 'Films' },
    { href: '/faq', label: 'FAQs' },
    { href: '/testimonials', label: 'Testimonials' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'bg-[#1C1817] py-4 border-b border-white/10'
            : scrolled
            ? 'py-3.5 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-[#E7DDD2]/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
            : isDarkTop
            ? 'py-5 sm:py-6 md:py-7 bg-gradient-to-b from-[#151211]/90 via-[#151211]/40 to-transparent'
            : 'py-5 sm:py-6 md:py-7 bg-[#FAF6F3]/80 backdrop-blur-md border-b border-[#E7DDD2]/40'
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20">
          <div className="flex items-center justify-between gap-8 lg:gap-12 xl:gap-16">
            {/* Brand Logo Container (Left Aligned, Uncropped) */}
            <div className="flex items-center shrink-0">
              <Link
                href="/"
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (pathname === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="group flex items-center shrink-0 py-1 cursor-pointer"
                aria-label="Indira Thakur Photography"
              >
                {logoUrl && !logoError ? (
                  <div className="relative flex items-center justify-start overflow-visible p-0.5">
                    <img
                      src={logoUrl}
                      alt={brand?.logo?.alt || 'Indira Thakur Photography Logo'}
                      onError={() => setLogoError(true)}
                      loading="eager"
                      className={`w-auto object-contain transition-all duration-300 ${
                        scrolled
                          ? 'h-7 sm:h-8 md:h-9 max-h-9 max-w-[160px] sm:max-w-[190px]'
                          : 'h-8 sm:h-10 md:h-11 lg:h-12 max-h-12 max-w-[190px] sm:max-w-[240px] md:max-w-[280px]'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span
                      className={`font-serif text-xl sm:text-2xl lg:text-2xl tracking-tight leading-none transition-colors duration-300 ${
                        mobileMenuOpen || isDarkTop ? 'text-white group-hover:text-[#D4AF7F]' : 'text-[#2B2625] group-hover:text-[#D4AF7F]'
                      }`}
                    >
                      Indira Thakur
                    </span>
                    <span
                      className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.35em] mt-1 transition-colors duration-300 ${
                        mobileMenuOpen || isDarkTop ? 'text-white/70' : 'text-[#7C706D]/70'
                      }`}
                    >
                      Fine Art Photography
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Desktop Navigation Links (Centred between Logo and Contact CTA) */}
            <nav className="desktop-nav hidden md:flex items-center justify-center flex-1 gap-4 lg:gap-7 xl:gap-9 px-2 lg:px-6">
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
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-[#D4AF7F] transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-1/2'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right: Dedicated Contact Primary CTA & Mobile Toggle */}
            <div className="flex items-center justify-end shrink-0 gap-4">
              {/* Desktop Luxury Contact Button */}
              <Link
                href="/contact"
                className="hidden md:inline-flex group relative items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-2.5 rounded-full bg-[#1F1B1A] text-[#FAF6F3] border border-[#D4AF7F] font-sans text-[10px] lg:text-[11px] font-medium uppercase tracking-[0.2em] shadow-[0_4px_16px_rgba(31,27,26,0.15)] transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-[2px] hover:border-[#E5C396] hover:bg-[#2A2423] hover:shadow-[0_6px_24px_rgba(212,175,127,0.35)] active:scale-[0.98] shrink-0"
              >
                <span>Contact</span>
                <HiArrowUpRight className="w-3.5 h-3.5 text-[#D4AF7F] transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-0.5" />
              </Link>

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className={`mobile-hamburger md:hidden p-2 transition-colors relative z-50 ${
                  mobileMenuOpen || isDarkTop ? 'text-white hover:text-[#D4AF7F]' : 'text-[#2B2625] hover:text-[#D4AF7F]'
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
      </motion.header>

      {/* Full-screen Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#1C1817] text-white flex flex-col justify-between px-8 pt-28 pb-12 md:hidden overflow-y-auto"
          >
            <div className="flex flex-col items-center justify-center gap-6 my-auto text-center">
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-serif text-2xl sm:text-3xl transition-all duration-300 italic tracking-wide ${
                        isActive
                          ? 'text-[#D4AF7F] font-normal underline decoration-[#D4AF7F]/40 underline-offset-8'
                          : 'text-white/90 hover:text-[#D4AF7F]'
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
                transition={{ delay: navLinks.length * 0.04 }}
                className="mt-6"
              >
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1F1B1A] text-[#FAF6F3] border border-[#D4AF7F] font-sans text-xs font-medium uppercase tracking-[0.22em] shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 hover:border-[#E8C89B] hover:shadow-[0_6px_24px_rgba(212,175,127,0.4)]"
                >
                  <span>Book a Session / Contact</span>
                  <HiArrowUpRight className="w-4 h-4 text-[#D4AF7F] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                </Link>
              </motion.div>
            </div>

            <div className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-white/40 border-t border-white/10 pt-6 mt-8">
              Indira Thakur Fine Art Photography · Mumbai
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
