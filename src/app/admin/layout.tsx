'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AdminLoading from './loading';
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
  HiShieldCheck,
  HiArrowTopRightOnSquare
} from 'react-icons/hi2';


interface SidebarGroup {
  label: string;
  links: { label: string; description: string; href: string; icon: any }[];
}

const sidebarGroups: SidebarGroup[] = [
  {
    label: 'Overview',
    links: [
      { label: 'Dashboard', description: 'Real-time stats & activity', href: '/admin/dashboard', icon: HiHome },
      { label: 'Analytics', description: 'Traffic & pageview metrics', href: '/admin/analytics', icon: HiSwatch },
    ],
  },
  {
    label: 'Content & Portfolio',
    links: [
      { label: 'Gallery', description: 'Photos, categories & grid order', href: '/admin/gallery', icon: HiPhoto },
      { label: 'Services', description: '6 photography packages', href: '/admin/services', icon: HiDocumentText },
      { label: 'Brands & Press', description: 'Client logos & collaborations', href: '/admin/brands', icon: HiBuildingStorefront },
      { label: 'Films & Cinema', description: 'YouTube & Google Drive videos', href: '/admin/films', icon: HiCommandLine },
      { label: 'Instagram Links', description: 'Homepage and category reels', href: '/admin/instagram-links', icon: HiCommandLine },
      { label: 'Video Testimonials', description: 'Client video reviews', href: '/admin/video-testimonials', icon: HiStar },
      { label: 'Client Reviews', description: 'Star ratings & testimonials', href: '/admin/reviews', icon: HiUserGroup },
      { label: 'FAQs', description: 'Questions & answers', href: '/admin/faq', icon: HiQuestionMarkCircle },
    ],
  },
  {
    label: 'Website',
    links: [
      { label: 'Homepage', description: 'Hero slides & section titles', href: '/admin/homepage', icon: HiSwatch },
      { label: 'About', description: 'Biography, philosophy & story', href: '/admin/about', icon: HiHeart },
      { label: 'Footer', description: 'Tagline, socials & contact', href: '/admin/footer', icon: HiGlobeAlt },
      { label: 'SEO', description: 'Meta titles & Open Graph cards', href: '/admin/seo', icon: HiGlobeAlt },
    ],
  },
  {
    label: 'Client Inquiries',
    links: [
      { label: 'Contact Messages', description: 'Client contact & commission inquiries', href: '/admin/contact', icon: HiEnvelope },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Theme & Typography', description: 'Fonts, colors & visual styling', href: '/admin/theme', icon: HiSwatch },
      { label: 'Brand & Identity', description: 'Logo, socials, contact & database', href: '/admin/settings', icon: HiGlobeAlt },
      { label: 'Admin Users', description: 'Super Admin & user roles', href: '/admin/users', icon: HiUsers },
      { label: 'Access Logs', description: 'Login history & active sessions', href: '/admin/access-log', icon: HiCog6Tooth },
      { label: 'Admin Security', description: 'Blocked IPs & security audit', href: '/admin/security', icon: HiShieldCheck },
      { label: 'System Health', description: 'Database connectivity & metrics', href: '/admin/health', icon: HiCommandLine },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      return;
    }

    if (isAuthenticated) {
      setCheckingAuth(false);
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      setCheckingAuth(true);

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
          const data = await res.json().catch(() => ({}));
          if (data.authenticated) {
            if (isMounted) setIsAuthenticated(true);
            return;
          }
        }

        try {
          localStorage.removeItem('admin_token');
        } catch {}
        if (isMounted) setIsAuthenticated(false);
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } catch {
        try {
          localStorage.removeItem('admin_token');
        } catch {}
        if (isMounted) setIsAuthenticated(false);
        router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkAuth();
    return () => { isMounted = false; };
  }, [pathname, router, isAuthenticated]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('admin_token');
    } catch {}
    setIsAuthenticated(false);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/admin/login';
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

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2B2625] flex overflow-hidden font-sans selection:bg-[#C39E96] selection:text-white">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1C1817]/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
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
                        prefetch={false}
                        onClick={() => setSidebarOpen(false)}
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
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E7DDD2]/60 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[#2B2625] p-2 hover:bg-[#FAF6F3] rounded-lg lg:hidden"
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
            >
              <HiBars3 className="w-6 h-6" />
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

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white hover:border-[#2B2625] transition-all shadow-2xs"
            >
              <HiArrowTopRightOnSquare className="w-3.5 h-3.5 text-[#C39E96]" />
              <span className="hidden sm:inline">Preview Website</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <div key={pathname} className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 bg-[#FAF6F3]">
          <Suspense fallback={<AdminLoading />}>
            {children}
          </Suspense>
        </div>
      </main>

    </div>
  );
}
