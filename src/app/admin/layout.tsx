'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HiHome, 
  HiPhoto, 
  HiCommandLine, 
  HiUserGroup, 
  HiQuestionMarkCircle, 
  HiCalendarDays, 
  HiEnvelope, 
  HiArrowRightOnRectangle, 
  HiBars3, 
  HiXMark, 
  HiHeart, 
  HiUsers, 
  HiDocumentText, 
  HiGlobeAlt, 
  HiSwatch, 
  HiBuildingStorefront, 
  HiCog6Tooth,
  HiStar,
  HiArrowTopRightOnSquare,
  HiMagnifyingGlass,
  HiChevronRight
} from 'react-icons/hi2';
import ToastContainer from '@/components/admin/Toast';

interface SidebarGroup {
  label: string;
  links: { label: string; description: string; href: string; icon: any }[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Main Dashboard',
    links: [
      { label: 'Overview', description: 'Stats & quick updates', href: '/admin/dashboard', icon: HiHome },
    ],
  },
  {
    label: 'Client Inquiries',
    links: [
      { label: 'Bookings', description: 'Session booking requests', href: '/admin/bookings', icon: HiCalendarDays },
      { label: 'Contact Messages', description: 'Inquiries from contact form', href: '/admin/contact', icon: HiEnvelope },
    ],
  },
  {
    label: 'Portfolio & Media',
    links: [
      { label: 'Gallery Images', description: 'Manage photos & albums', href: '/admin/gallery', icon: HiPhoto },
      { label: 'Films & Cinema', description: 'Manage video highlights & shorts', href: '/admin/films-cms', icon: HiCommandLine },
      { label: 'Video Testimonials', description: 'Upload client video reviews', href: '/admin/video-testimonials', icon: HiUserGroup },
      { label: 'Services & Packages', description: 'Photography offerings', href: '/admin/services', icon: HiCommandLine },
    ],
  },
  {
    label: 'Website Pages',
    links: [
      { label: 'Home Page', description: 'Hero banner & main layout', href: '/admin/home', icon: HiHome },
      { label: 'About Story', description: 'Bio, philosophy & portraits', href: '/admin/about', icon: HiHeart },
      { label: 'Client Reviews', description: 'Testimonials & quotes', href: '/admin/testimonials', icon: HiUserGroup },
      { label: 'FAQs', description: 'Frequently asked questions', href: '/admin/faq', icon: HiQuestionMarkCircle },
      { label: 'Contact Details', description: 'Email, phone & location', href: '/admin/contact-cms', icon: HiEnvelope },
      { label: 'Footer Settings', description: 'Copyright & social links', href: '/admin/footer-cms', icon: HiDocumentText },
    ],
  },
  {
    label: 'Branding & Design',
    links: [
      { label: 'Brand & Logo', description: 'Upload official logo', href: '/admin/brand', icon: HiBuildingStorefront },
      { label: 'Brand Partners', description: 'Logos we\'ve worked with', href: '/admin/brands', icon: HiBuildingStorefront },
      { label: 'Color Theme', description: 'Palette & font style', href: '/admin/theme', icon: HiSwatch },
      { label: 'SEO & Search', description: 'Google title & meta tags', href: '/admin/seo-cms', icon: HiGlobeAlt },
    ],
  },
  {
    label: 'System & Admin',
    links: [
      { label: 'Admin Accounts', description: 'Manage login credentials', href: '/admin/users', icon: HiUsers },
      { label: 'My Account', description: 'Change password', href: '/admin/account', icon: HiCog6Tooth },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close mobile navigation on route changes
  useEffect(() => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
    setSearchQuery('');
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

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/auth/verify', {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          if (isMounted) setIsAuthenticated(true);
        } else {
          if (isMounted) setIsAuthenticated(false);
          router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuth();
    return () => { isMounted = false; };
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_token');
    } catch {}
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF6F3] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C39E96]/30 border-t-[#C39E96] rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-[#7C706D] uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const activeLink = sidebarGroups.flatMap(g => g.links).find(l => pathname === l.href);

  const filteredSidebarGroups = sidebarGroups.map((group) => {
    if (!searchQuery.trim()) return group;
    const q = searchQuery.toLowerCase().trim();
    const matchingLinks = group.links.filter(
      (link) =>
        link.label.toLowerCase().includes(q) ||
        link.description.toLowerCase().includes(q)
    );
    return {
      ...group,
      links: matchingLinks,
    };
  }).filter((group) => group.links.length > 0);

  const quickShortcuts = [
    { label: 'Overview', href: '/admin/dashboard', icon: HiHome },
    { label: 'Bookings', href: '/admin/bookings', icon: HiCalendarDays },
    { label: 'Gallery', href: '/admin/gallery', icon: HiPhoto },
    { label: 'Home CMS', href: '/admin/home', icon: HiHome },
    { label: 'Brand & Logo', href: '/admin/brand', icon: HiBuildingStorefront },
    { label: 'Messages', href: '/admin/contact', icon: HiEnvelope },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2B2625] flex overflow-hidden font-sans selection:bg-[#C39E96] selection:text-white">
      
      {/* FULL-SCREEN SLIDE-IN MOBILE NAVIGATION MENU */}
      <div
        className={`fixed inset-0 z-50 bg-[#FAF6F3] text-[#2B2625] flex flex-col h-screen w-screen overflow-hidden lg:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
      >
        {/* Full-Screen Menu Header */}
        <div className="px-5 py-4 border-b border-[#E7DDD2]/70 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 shadow-2xs">
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-[#2B2625]"
          >
            <div className="w-10 h-10 rounded-full bg-[#2B2625] flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm">
              IT
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-medium leading-none tracking-tight text-[#2B2625]">
                Indira Thakur
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#7C706D] mt-1">
                Studio Manager
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-all flex items-center gap-1.5"
              title="Preview Website"
            >
              <HiArrowTopRightOnSquare className="w-4 h-4 text-[#C39E96]" />
              <span className="text-[11px]">Site ↗</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-11 h-11 rounded-xl bg-[#2B2625] text-white flex items-center justify-center hover:bg-[#C39E96] transition-colors shadow-sm active:scale-95"
              aria-label="Close mobile navigation menu"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quick Search & Shortcuts Bar */}
        <div className="p-4 bg-white/50 border-b border-[#E7DDD2]/50 flex-shrink-0 space-y-3">
          <div className="relative">
            <HiMagnifyingGlass className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C706D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admin pages (e.g. Gallery, Bookings, Logo)..."
              className="w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border border-[#E7DDD2] text-sm text-[#2B2625] placeholder-[#7C706D]/70 focus:outline-none focus:ring-2 focus:ring-[#C39E96] focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7C706D] hover:text-[#2B2625]"
                aria-label="Clear search"
              >
                <HiXMark className="w-4 h-4" />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="font-mono text-[10px] text-[#7C706D] uppercase tracking-wider flex-shrink-0 mr-1">
                Jump to:
              </span>
              {quickShortcuts.map((sc) => {
                const Icon = sc.icon;
                const isCurrent = pathname === sc.href;
                return (
                  <Link
                    key={sc.href}
                    href={sc.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                      isCurrent
                        ? 'bg-[#2B2625] text-white border-[#2B2625] shadow-2xs'
                        : 'bg-white text-[#2B2625] border-[#E7DDD2] hover:border-[#2B2625]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#C39E96]' : 'text-[#7C706D]'}`} />
                    <span>{sc.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredSidebarGroups.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="font-serif text-lg text-[#2B2625]">No pages found</p>
              <p className="text-xs text-[#7C706D]">Try searching for "bookings", "gallery", "theme", or "home".</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-[#2B2625] text-white text-xs font-medium"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredSidebarGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[11px] font-semibold text-[#7C706D] uppercase tracking-[0.2em]">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-mono text-[#7C706D]/70 bg-[#E7DDD2]/40 px-2 py-0.5 rounded-full">
                    {group.links.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 group active:scale-[0.99] ${
                          isActive
                            ? 'bg-[#2B2625] text-white border-[#2B2625] shadow-sm'
                            : 'bg-white text-[#2B2625] border-[#E7DDD2]/80 hover:border-[#2B2625]'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive
                                ? 'bg-white/10 text-[#C39E96]'
                                : 'bg-[#FAF6F3] text-[#2B2625] group-hover:bg-[#2B2625] group-hover:text-white'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-serif text-base font-medium leading-tight truncate">
                              {link.label}
                            </span>
                            <span
                              className={`text-xs mt-0.5 truncate ${
                                isActive ? 'text-white/70' : 'text-[#7C706D]'
                              }`}
                            >
                              {link.description}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {isActive && (
                            <span className="font-mono text-[9px] uppercase tracking-widest bg-[#C39E96] text-white px-2 py-0.5 rounded-full font-bold">
                              Active
                            </span>
                          )}
                          <HiChevronRight
                            className={`w-5 h-5 ${
                              isActive ? 'text-white/60' : 'text-[#7C706D]/50 group-hover:text-[#2B2625]'
                            }`}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Full-Screen Menu Bottom Footer Actions */}
        <div className="p-4 border-t border-[#E7DDD2]/70 bg-white shadow-xl flex-shrink-0 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2] text-xs font-semibold text-[#2B2625] hover:bg-white transition-all shadow-2xs"
            >
              <HiArrowTopRightOnSquare className="w-4 h-4 text-[#C39E96]" />
              <span>Live Website</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-all shadow-2xs"
            >
              <HiArrowRightOnRectangle className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
          <p className="text-center font-mono text-[10px] text-[#7C706D]/70 uppercase tracking-widest">
            Indira Thakur Studio Manager • Admin Authenticated
          </p>
        </div>
      </div>

      {/* Desktop Mobile Drawer Overlay fallback */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1C1817]/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen bg-white border-r border-[#E7DDD2]/60 shadow-sm transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
        role="navigation"
        aria-label="Admin sidebar"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header & Logo */}
          <div className="p-5 border-b border-[#E7DDD2]/50 flex-shrink-0 bg-[#FAF6F3]/50">
            <div className="flex items-center justify-between">
              <Link 
                href="/admin/dashboard" 
                className="group flex items-center gap-3 text-[#2B2625]"
                aria-label="Admin Panel Home"
              >
                <div className="w-9 h-9 rounded-full bg-[#2B2625] flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm group-hover:bg-[#C39E96] transition-colors">
                  IT
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className="font-serif text-lg font-medium leading-none tracking-tight text-[#2B2625]">
                      Indira Thakur
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#7C706D] mt-1">
                      Studio Manager
                    </span>
                  </div>
                )}
              </Link>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden text-[#7C706D] p-2 hover:text-[#2B2625] rounded-md"
                  aria-label="Close sidebar"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Collapse toggle button */}
            <div className="hidden lg:flex mt-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`flex items-center gap-2 w-full py-1.5 px-2 rounded-md font-sans text-xs text-[#7C706D] hover:bg-white hover:text-[#2B2625] transition-colors border border-transparent hover:border-[#E7DDD2]/50 ${
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                }`}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <HiBars3 className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">Collapse Menu</span>}
              </button>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" role="navigation">
            {sidebarGroups.map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="px-3 mb-2 font-mono text-[10px] text-[#7C706D]/80 font-semibold uppercase tracking-[0.25em]">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-[#2B2625] text-white shadow-sm'
                            : 'text-[#7C706D] hover:bg-[#FAF6F3] hover:text-[#2B2625]'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                        title={sidebarCollapsed ? `${link.label} — ${link.description}` : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-[#C39E96]' : 'text-[#7C706D] group-hover:text-[#2B2625]'}`} aria-hidden="true" />
                        {!sidebarCollapsed && (
                          <div className="flex flex-col min-w-0">
                            <span className="truncate leading-tight">{link.label}</span>
                            <span className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-[#7C706D]/60'}`}>
                              {link.description}
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer controls */}
          <div className="p-3 border-t border-[#E7DDD2]/50 space-y-1.5 flex-shrink-0 bg-[#FAF6F3]/30">
            <Link
              href="/"
              target="_blank"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#2B2625] hover:bg-white hover:shadow-xs transition-all border border-[#E7DDD2]/60 ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'View Live Website' : undefined}
            >
              <HiArrowTopRightOnSquare className="w-4 h-4 text-[#C39E96] flex-shrink-0" />
              {!sidebarCollapsed && <span>View Live Website</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 transition-all w-full ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Sign Out' : undefined}
            >
              <HiArrowRightOnRectangle className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E7DDD2]/60 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-[#2B2625] p-2 hover:bg-[#FAF6F3] rounded-xl lg:hidden flex items-center gap-2 border border-[#E7DDD2]/80 bg-[#FAF6F3]/60 active:scale-95 transition-all"
              aria-label="Open mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              <HiBars3 className="w-6 h-6 text-[#2B2625]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#2B2625] pr-1 hidden sm:inline">
                Menu
              </span>
            </button>
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl font-medium text-[#2B2625]">
                {activeLink?.label || 'Studio Dashboard'}
              </span>
              <span className="font-sans text-xs text-[#7C706D] hidden sm:inline">
                {activeLink?.description || 'Manage website content, inquiries & portfolio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-md bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white hover:border-[#2B2625] transition-all shadow-2xs"
            >
              <HiArrowTopRightOnSquare className="w-3.5 h-3.5 text-[#C39E96]" />
              <span className="hidden sm:inline">Preview Website</span>
              <span className="sm:hidden text-[11px]">Site ↗</span>
            </Link>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 bg-[#FAF6F3]">
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
