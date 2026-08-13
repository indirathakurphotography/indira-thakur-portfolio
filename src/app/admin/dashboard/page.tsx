'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  HiPhoto,
  HiCommandLine,
  HiUserGroup,
  HiClock,
  HiArrowRight,
  HiArrowUpTray,
  HiArrowDownTray,
  HiCalendarDays,
  HiEnvelope,
  HiCheckCircle,
  HiExclamationCircle,
  HiHeart,
  HiSwatch,
  HiGlobeAlt,
  HiTrophy,
  HiEye,
  HiUsers,
  HiDevicePhoneMobile,
  HiComputerDesktop,
  HiDeviceTablet,
  HiArrowPath,
  HiChartBar,
} from 'react-icons/hi2';

interface Booking {
  _id: string;
  name: string;
  email: string;
  serviceType?: string;
  date?: string;
  createdAt?: string;
}

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  message?: string;
  createdAt?: string;
}

interface DashboardStats {
  galleryImages: number;
  films: number;
  videoTestimonials: number;
  services: number;
  testimonials: number;
  reviews: number;
  faqs: number;
  bookings: number;
  contacts: number;
  lastUpdated: string;
}

interface AnalyticsStats {
  totalPageViews: number;
  uniqueVisitors: number;
  todayViews: number;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  topPages: { path: string; count: number }[];
  dailyTrends: { date: string; views: number; visitors: number }[];
  recentActivity: {
    path: string;
    referrer?: string;
    device: 'mobile' | 'tablet' | 'desktop';
    browser?: string;
    os?: string;
    sessionId: string;
    timestamp: string;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    galleryImages: 0,
    films: 0,
    videoTestimonials: 0,
    services: 0,
    testimonials: 0,
    reviews: 0,
    faqs: 0,
    bookings: 0,
    contacts: 0,
    lastUpdated: '',
  });

  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
    topPages: [],
    dailyTrends: [],
    recentActivity: [],
  });

  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentContacts, setRecentContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token')) : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/analytics/stats', { headers, credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token')) : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const res = await fetch('/api/dashboard', { headers, credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const dashData = await res.json();

      setStats({
        galleryImages: typeof dashData.totalImages === 'number' ? dashData.totalImages : 0,
        films: typeof dashData.totalFilms === 'number' ? dashData.totalFilms : 0,
        videoTestimonials: typeof dashData.totalVideoTestimonials === 'number' ? dashData.totalVideoTestimonials : 0,
        services: typeof dashData.totalServices === 'number' ? dashData.totalServices : 0,
        testimonials: typeof dashData.totalTestimonials === 'number' ? dashData.totalTestimonials : 0,
        reviews: typeof dashData.totalReviews === 'number' ? dashData.totalReviews : 0,
        faqs: typeof dashData.totalFAQs === 'number' ? dashData.totalFAQs : 0,
        bookings: typeof dashData.totalBookings === 'number' ? dashData.totalBookings : 0,
        contacts: typeof dashData.totalContacts === 'number' ? dashData.totalContacts : 0,
        lastUpdated: dashData.lastUpdated || new Date().toISOString(),
      });

      setRecentBookings(dashData.recentBookings || []);
      setRecentContacts(dashData.recentContactsList || []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/cms-export');
      if (!res.ok) throw new Error('Failed to export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `indira-thakur-photography-backup-${date}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
      }, 0);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export content backup.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Import failed');
      setImportMsg({ type: 'success', text: 'All content restored successfully!' });
      fetchData();
    } catch {
      setImportMsg({ type: 'error', text: 'Failed to import. Please select a valid JSON backup file.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const statCards = [
    { label: 'Published Photos', value: stats.galleryImages, icon: HiPhoto, color: 'text-[#C39E96]', bg: 'bg-[#C39E96]/10' },
    { label: 'Films & Cinema', value: stats.films, icon: HiCommandLine, color: 'text-rose-700', bg: 'bg-rose-50' },
    { label: 'Video Testimonials', value: stats.videoTestimonials, icon: HiUserGroup, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Services Offered', value: stats.services, icon: HiSwatch, color: 'text-teal-700', bg: 'bg-teal-50' },
    { label: 'Client Reviews', value: stats.testimonials + stats.reviews, icon: HiHeart, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Booking Requests', value: stats.bookings, icon: HiCalendarDays, color: 'text-sky-700', bg: 'bg-sky-50' },
    { label: 'Contact Messages', value: stats.contacts, icon: HiEnvelope, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'Last Studio Update', value: 0, icon: HiClock, isDate: true, color: 'text-stone-700', bg: 'bg-stone-100' },
  ];

  const studioSections = [
    { title: 'Gallery & Portfolio', desc: 'Add new photography work, create albums, or feature hero shots.', href: '/admin/gallery', icon: HiPhoto },
    { title: 'Services & Pricing', desc: 'Update session details, package prices, and offerings.', href: '/admin/services', icon: HiCommandLine },
    { title: 'About & Philosophy', desc: 'Edit your bio, artist statement, and profile portraits.', href: '/admin/about', icon: HiHeart },
    { title: 'Client Reviews', desc: 'Manage client feedback, quotes, and testimonials.', href: '/admin/reviews', icon: HiUserGroup },
    { title: 'Brands & Press', desc: 'Upload official logo assets or update studio details.', href: '/admin/brands', icon: HiSwatch },
    { title: 'SEO & Google Search', desc: 'Optimize titles and search descriptions for clients.', href: '/admin/seo', icon: HiGlobeAlt },

  ];

  const totalDevices = (analytics.deviceBreakdown.desktop + analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.tablet) || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-xl border border-[#E7DDD2]/70 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF6F3] border border-[#E7DDD2] font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96]">
            <HiTrophy className="w-3.5 h-3.5" />
            Studio Management Center
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#2B2625] font-normal">
            Welcome back, Indira
          </h1>
          <p className="font-sans text-sm text-[#7C706D] max-w-2xl">
            Everything on your website is running smoothly. Monitor production visitor analytics or update your studio portfolio below.
          </p>
        </div>

        <Link
          href="/admin/gallery"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#2B2625] text-white hover:bg-[#3D3534] font-medium text-xs tracking-wider uppercase transition-all shadow-sm shrink-0"
        >
          <HiPhoto className="w-4 h-4 text-[#C39E96]" />
          <span>Upload Photos</span>
        </Link>
      </motion.div>

      {/* REAL PRODUCTION VISITOR ANALYTICS */}
      <div className="bg-white rounded-xl border border-[#E7DDD2]/70 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7DDD2]/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2B2625] text-white">
              <HiChartBar className="w-5 h-5 text-[#C39E96]" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-[#2B2625] font-normal">Real Visitor Analytics</h2>
              <p className="font-sans text-xs text-[#7C706D]">Live production site visits, pages viewed & device activity</p>
            </div>
          </div>
          <button
            onClick={() => fetchAnalytics()}
            disabled={analyticsLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-colors"
          >
            <HiArrowPath className={`w-3.5 h-3.5 text-[#C39E96] ${analyticsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* 4 Analytics Key Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FAF6F3]/80 p-4 rounded-xl border border-[#E7DDD2]/60 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-lg">
              <HiEye className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-medium text-[#7C706D] uppercase tracking-wider">Total Page Views</p>
              <p className="font-serif text-2xl text-[#2B2625] font-semibold">{analytics.totalPageViews}</p>
            </div>
          </div>

          <div className="bg-[#FAF6F3]/80 p-4 rounded-xl border border-[#E7DDD2]/60 flex items-center gap-4">
            <div className="p-3 bg-sky-100 text-sky-800 rounded-lg">
              <HiUsers className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-medium text-[#7C706D] uppercase tracking-wider">Unique Visitors</p>
              <p className="font-serif text-2xl text-[#2B2625] font-semibold">{analytics.uniqueVisitors}</p>
            </div>
          </div>

          <div className="bg-[#FAF6F3]/80 p-4 rounded-xl border border-[#E7DDD2]/60 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
              <HiClock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-sans text-xs font-medium text-[#7C706D] uppercase tracking-wider">Views Today</p>
              <p className="font-serif text-2xl text-[#2B2625] font-semibold">{analytics.todayViews}</p>
            </div>
          </div>

          <div className="bg-[#FAF6F3]/80 p-4 rounded-xl border border-[#E7DDD2]/60 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-800 rounded-lg">
              <HiGlobeAlt className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-xs font-medium text-[#7C706D] uppercase tracking-wider">Top Page</p>
              <p className="font-serif text-base text-[#2B2625] font-semibold truncate">
                {analytics.topPages[0]?.path || '/'}
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Details: Device Breakdown & Top Visited Routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Top Visited Pages */}
          <div className="bg-[#FAF6F3]/50 p-5 rounded-xl border border-[#E7DDD2]/60 space-y-3">
            <h3 className="font-serif text-base text-[#2B2625] font-medium flex items-center gap-2">
              <HiGlobeAlt className="w-4 h-4 text-[#C39E96]" />
              Top Visited Pages & Sections
            </h3>
            {analytics.topPages.length === 0 ? (
              <p className="font-sans text-xs text-[#7C706D] py-4 italic">No traffic recorded yet. Visits will automatically appear here as clients browse the studio website.</p>
            ) : (
              <div className="space-y-2">
                {analytics.topPages.map((p, idx) => {
                  const pct = Math.round((p.count / (analytics.totalPageViews || 1)) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-sans text-xs text-[#2B2625]">
                        <span className="font-mono text-[11px] truncate">{p.path}</span>
                        <span className="font-semibold">{p.count} view{p.count !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[#E7DDD2]/50 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2B2625] h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 5)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Device Category Breakdown */}
          <div className="bg-[#FAF6F3]/50 p-5 rounded-xl border border-[#E7DDD2]/60 space-y-4">
            <h3 className="font-serif text-base text-[#2B2625] font-medium flex items-center gap-2">
              <HiComputerDesktop className="w-4 h-4 text-[#C39E96]" />
              Visitor Device Category
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between font-sans text-xs text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiComputerDesktop className="w-4 h-4 text-stone-700" /> Desktop
                  </span>
                  <span className="font-semibold">{analytics.deviceBreakdown.desktop} ({Math.round((analytics.deviceBreakdown.desktop / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E7DDD2]/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-stone-800 h-full rounded-full" style={{ width: `${(analytics.deviceBreakdown.desktop / totalDevices) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-sans text-xs text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiDevicePhoneMobile className="w-4 h-4 text-rose-700" /> Mobile Phone
                  </span>
                  <span className="font-semibold">{analytics.deviceBreakdown.mobile} ({Math.round((analytics.deviceBreakdown.mobile / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E7DDD2]/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-rose-700 h-full rounded-full" style={{ width: `${(analytics.deviceBreakdown.mobile / totalDevices) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between font-sans text-xs text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiDeviceTablet className="w-4 h-4 text-sky-700" /> Tablet
                  </span>
                  <span className="font-semibold">{analytics.deviceBreakdown.tablet} ({Math.round((analytics.deviceBreakdown.tablet / totalDevices) * 100)}%)</span>
                </div>
                <div className="w-full bg-[#E7DDD2]/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-700 h-full rounded-full" style={{ width: `${(analytics.deviceBreakdown.tablet / totalDevices) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Visitor Activity Feed */}
        <div className="bg-[#FAF6F3]/50 p-5 rounded-xl border border-[#E7DDD2]/60 space-y-3">
          <h3 className="font-serif text-base text-[#2B2625] font-medium flex items-center gap-2">
            <HiClock className="w-4 h-4 text-[#C39E96]" />
            Live Visitor Activity Stream
          </h3>

          {analytics.recentActivity.length === 0 ? (
            <p className="font-sans text-xs text-[#7C706D] py-3 italic">No recent sessions recorded. Public visits will stream live here.</p>
          ) : (
            <div className="divide-y divide-[#E7DDD2]/40 max-h-60 overflow-y-auto pr-2">
              {analytics.recentActivity.map((act, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs font-sans gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1.5 rounded bg-white border border-[#E7DDD2] text-[#2B2625]">
                      {act.device === 'mobile' ? <HiDevicePhoneMobile className="w-3.5 h-3.5 text-rose-700" /> : <HiComputerDesktop className="w-3.5 h-3.5 text-stone-700" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-[#2B2625] truncate">{act.path}</p>
                      <p className="text-[10px] text-[#7C706D] font-mono">{act.browser} on {act.os}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#7C706D] shrink-0">{formatRelativeTime(act.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Studio Content Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white rounded-xl border border-[#E7DDD2]/60 p-5 shadow-2xs hover:shadow-xs transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-xs font-medium text-[#7C706D] uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="font-serif text-2xl text-[#2B2625] font-semibold mt-0.5">
                  {loading ? '...' : stat.isDate ? formatDate(stats.lastUpdated) : stat.value}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid: Quick Action Cards & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Management Section (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-[#2B2625] font-normal">
              Manage Website Content
            </h2>
            <span className="text-xs text-[#7C706D]">Click any box to edit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {studioSections.map((sec) => (
              <Link
                key={sec.href}
                href={sec.href}
                className="group bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs hover:shadow-md hover:border-[#2B2625] transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2]/60 flex items-center justify-center text-[#2B2625] group-hover:bg-[#2B2625] group-hover:text-white transition-colors">
                    <sec.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-base text-[#2B2625] font-medium group-hover:text-[#C39E96] transition-colors">
                    {sec.title}
                  </h3>
                  <p className="font-sans text-xs text-[#7C706D] leading-relaxed">
                    {sec.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-[#2B2625] mt-4 pt-3 border-t border-[#E7DDD2]/30 group-hover:translate-x-1 transition-transform">
                  <span>Edit Now</span>
                  <HiArrowRight className="w-3.5 h-3.5 text-[#C39E96]" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar Column: Client Inquiries & Backup (1 col) */}
        <div className="space-y-6">
          {/* Recent Inquiries Panel */}
          <div className="bg-white rounded-xl border border-[#E7DDD2]/60 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DDD2]/50 pb-3">
              <div className="flex items-center gap-2">
                <HiCalendarDays className="w-5 h-5 text-[#C39E96]" />
                <h2 className="font-serif text-base text-[#2B2625] font-medium">Recent Inquiries</h2>
              </div>
              <Link href="/admin/bookings" className="text-xs text-[#C39E96] hover:underline font-medium">
                View All
              </Link>
            </div>

            {loading ? (
              <p className="text-xs text-[#7C706D]">Loading inquiries...</p>
            ) : recentBookings.length === 0 && recentContacts.length === 0 ? (
              <div className="text-center py-6 px-4 bg-[#FAF6F3] rounded-lg border border-dashed border-[#E7DDD2]">
                <HiCheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-70" />
                <p className="font-serif text-sm text-[#2B2625]">All clear!</p>
                <p className="font-sans text-xs text-[#7C706D] mt-1">
                  No pending booking requests or messages at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div key={b._id} className="p-3 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2]/50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-medium text-[#2B2625]">
                      <span>{b.name}</span>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-mono">
                        Booking
                      </span>
                    </div>
                    <p className="text-[#7C706D] truncate">{b.email}</p>
                    {b.serviceType && <p className="text-[#2B2625] font-serif italic text-[11px]">{b.serviceType}</p>}
                  </div>
                ))}
                {recentContacts.map((c) => (
                  <div key={c._id} className="p-3 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2]/50 text-xs space-y-1">
                    <div className="flex items-center justify-between font-medium text-[#2B2625]">
                      <span>{c.name}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                        Message
                      </span>
                    </div>
                    <p className="text-[#7C706D] truncate">{c.email}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup & Safety Copy Panel */}
          <div className="bg-white rounded-xl border border-[#E7DDD2]/60 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E7DDD2]/50 pb-3">
              <HiArrowDownTray className="w-5 h-5 text-[#2B2625]" />
              <h2 className="font-serif text-base text-[#2B2625] font-medium">Backup Studio Content</h2>
            </div>

            <p className="font-sans text-xs text-[#7C706D] leading-relaxed">
              Download a safety copy of all your website text, services, and configuration file anytime.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2B2625] text-white rounded-lg hover:bg-[#3D3534] transition-colors font-medium text-xs uppercase tracking-wider"
              >
                <HiArrowDownTray className="w-4 h-4 text-[#C39E96]" />
                Export Safety Copy
              </button>

              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E7DDD2] bg-[#FAF6F3] rounded-lg hover:bg-white transition-colors font-medium text-xs text-[#2B2625] cursor-pointer">
                <HiArrowUpTray className="w-4 h-4 text-[#7C706D]" />
                <span>{importing ? 'Restoring...' : 'Restore Backup File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>

              {importMsg && (
                <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {importMsg.type === 'success' ? <HiCheckCircle className="w-4 h-4 shrink-0" /> : <HiExclamationCircle className="w-4 h-4 shrink-0" />}
                  <span>{importMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
