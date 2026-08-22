'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  HiPhoto,
  HiCommandLine,
  HiUserGroup,
  HiClock,
  HiArrowRight,
  HiEnvelope,
  HiCheckCircle,
  HiHeart,
  HiSwatch,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiStar,
  HiBuildingStorefront,
  HiArrowTopRightOnSquare,
  HiArrowPath,
  HiSparkles,
  HiEye,
  HiShieldCheck,
  HiClipboardDocumentList,
  HiChartBar,
  HiLockClosed,
  HiNoSymbol,
  HiCog6Tooth,
} from 'react-icons/hi2';

interface ContactSubmission {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
}

interface AuditLogSummary {
  _id: string;
  action: string;
  adminEmail: string;
  adminName?: string;
  status: 'success' | 'failure';
  createdAt: string;
}

interface DashboardStats {
  galleryImages: number;
  films: number;
  videoTestimonials: number;
  services: number;
  testimonials: number;
  reviews: number;
  faqs: number;
  contacts: number;
  unreadContacts: number;
  totalPageViews: number;
  todayPageViews: number;
  activeSessions: number;
  failedLogins: number;
  blockedIps: number;
  recentAuditLogs: AuditLogSummary[];
  recentContactsList: ContactSubmission[];
  lastUpdated: string;
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
    contacts: 0,
    unreadContacts: 0,
    totalPageViews: 0,
    todayPageViews: 0,
    activeSessions: 0,
    failedLogins: 0,
    blockedIps: 0,
    recentAuditLogs: [],
    recentContactsList: [],
    lastUpdated: '',
  });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token')
          : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const res = await fetch('/api/dashboard', { headers, credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load dashboard telemetry');
      const dashData = await res.json();

      setStats({
        galleryImages: typeof dashData.totalImages === 'number' ? dashData.totalImages : 0,
        films: typeof dashData.totalFilms === 'number' ? dashData.totalFilms : 0,
        videoTestimonials:
          typeof dashData.totalVideoTestimonials === 'number' ? dashData.totalVideoTestimonials : 0,
        services: typeof dashData.totalServices === 'number' ? dashData.totalServices : 0,
        testimonials: typeof dashData.totalTestimonials === 'number' ? dashData.totalTestimonials : 0,
        reviews: typeof dashData.totalReviews === 'number' ? dashData.totalReviews : 0,
        faqs: typeof dashData.totalFAQs === 'number' ? dashData.totalFAQs : 0,
        contacts: typeof dashData.totalContacts === 'number' ? dashData.totalContacts : 0,
        unreadContacts: typeof dashData.unreadMessages === 'number' ? dashData.unreadMessages : 0,
        totalPageViews: typeof dashData.totalPageViews === 'number' ? dashData.totalPageViews : 0,
        todayPageViews: typeof dashData.todayPageViews === 'number' ? dashData.todayPageViews : 0,
        activeSessions: typeof dashData.activeSessions === 'number' ? dashData.activeSessions : 1,
        failedLogins: typeof dashData.failedLogins === 'number' ? dashData.failedLogins : 0,
        blockedIps: typeof dashData.blockedIps === 'number' ? dashData.blockedIps : 0,
        recentAuditLogs: dashData.recentAuditLogs || [],
        recentContactsList: dashData.recentContactsList || [],
        lastUpdated: dashData.lastUpdated || new Date().toISOString(),
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const quickLinks = [
    {
      title: 'Gallery Portfolio',
      description: `${stats.galleryImages} curated fine art photographs`,
      href: '/admin/gallery',
      icon: HiPhoto,
      count: stats.galleryImages,
    },
    {
      title: 'Services & Packages',
      description: `${stats.services || 6} client photography collections`,
      href: '/admin/services',
      icon: HiDocumentText,
      count: stats.services || 6,
    },
    {
      title: 'Client Inquiries',
      description: `${stats.unreadContacts} new unread commission messages`,
      href: '/admin/contact',
      icon: HiEnvelope,
      count: stats.contacts,
      badge: stats.unreadContacts > 0 ? `${stats.unreadContacts} new` : undefined,
    },
    {
      title: 'Visitor Analytics',
      description: `${stats.totalPageViews} total verified views (${stats.todayPageViews} today)`,
      href: '/admin/analytics',
      icon: HiChartBar,
      count: stats.totalPageViews,
    },
    {
      title: 'Security & Access',
      description: `${stats.activeSessions} active sessions • ${stats.blockedIps} blocked IPs`,
      href: '/admin/security',
      icon: HiShieldCheck,
    },
    {
      title: 'Audit Trail',
      description: 'Administrative actions & security event log',
      href: '/admin/audit-log',
      icon: HiClipboardDocumentList,
    },
    {
      title: 'Admin Settings',
      description: 'Account management, studio address & branding',
      href: '/admin/settings',
      icon: HiCog6Tooth,
    },
    {
      title: 'Reviews & Stories',
      description: `${stats.reviews || stats.testimonials} client star reviews & quotes`,
      href: '/admin/reviews',
      icon: HiUserGroup,
      count: stats.reviews || stats.testimonials,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Welcome & System Pulse Card */}
      <div className="bg-white rounded-2xl border border-[#E7DDD2] p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Studio System Operational
            </span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl text-[#2B2625] font-semibold tracking-tight">
            Indira Thakur CMS Control Panel
          </h1>
          <p className="text-xs text-[#7C706D] font-sans max-w-2xl leading-relaxed">
            Manage your fine art photography portfolio, client bookings, editorial content, user security, and analytics from one unified control center.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E7DDD2] bg-[#FAF6F3] text-xs font-medium text-[#2B2625] hover:bg-[#F3ECE6] transition-colors cursor-pointer"
          >
            <HiArrowPath className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2B2625] text-white hover:bg-[#1C1817] text-xs font-medium uppercase tracking-wider rounded-xl transition-colors shadow-xs"
          >
            <span>View Live Website</span>
            <HiArrowTopRightOnSquare className="w-4 h-4 text-[#C39E96]" />
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={fetchData} className="underline font-semibold ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Real Statistics Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl border border-[#E7DDD2] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7C706D]">
            <span className="text-xs font-mono uppercase tracking-wider">Client Inquiries</span>
            <HiEnvelope className="w-4 h-4 text-[#C39E96]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl text-[#2B2625] font-semibold">
              {stats.contacts}
            </span>
            {stats.unreadContacts > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-medium">
                {stats.unreadContacts} new
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7C706D] font-sans">
            Commission booking messages
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E7DDD2] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7C706D]">
            <span className="text-xs font-mono uppercase tracking-wider">Page Views</span>
            <HiEye className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-serif text-3xl text-[#2B2625] font-semibold">
            {stats.totalPageViews}
          </div>
          <p className="text-[11px] text-[#7C706D] font-sans">
            {stats.todayPageViews} views recorded today
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E7DDD2] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7C706D]">
            <span className="text-xs font-mono uppercase tracking-wider">Admin Security</span>
            <HiShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-3xl text-emerald-800 font-semibold">
            {stats.activeSessions}
          </div>
          <p className="text-[11px] text-[#7C706D] font-sans">
            Active session{stats.activeSessions === 1 ? '' : 's'} • {stats.blockedIps} blocked IPs
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#E7DDD2] p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#7C706D]">
            <span className="text-xs font-mono uppercase tracking-wider">Gallery Photos</span>
            <HiPhoto className="w-4 h-4 text-[#C39E96]" />
          </div>
          <div className="font-serif text-3xl text-[#2B2625] font-semibold">
            {stats.galleryImages}
          </div>
          <p className="text-[11px] text-[#7C706D] font-sans">
            Published fine art photographs
          </p>
        </div>
      </div>

      {/* Quick Navigation to Major Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#2B2625] font-semibold">
            Control Center Hub
          </h2>
          <span className="text-xs font-mono text-[#7C706D]">
            Single-click access to all modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-[#E7DDD2] p-5 hover:border-[#2B2625] hover:shadow-xs transition-all group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] flex items-center justify-center text-[#C39E96] group-hover:bg-[#2B2625] group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    {link.badge && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-100 text-amber-900">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-base text-[#2B2625] font-semibold group-hover:text-[#C39E96] transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-xs text-[#7C706D] font-sans leading-relaxed">
                    {link.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E7DDD2]/60 flex items-center justify-between text-xs font-sans font-medium text-[#2B2625]">
                  <span>Manage Section</span>
                  <HiArrowRight className="w-3.5 h-3.5 text-[#C39E96] group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Lower Section: Recent Inquiries & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Client Inquiries Section */}
        <div className="bg-white rounded-2xl border border-[#E7DDD2] p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-4">
              <div className="space-y-0.5">
                <h2 className="font-serif text-base font-semibold text-[#2B2625]">
                  Recent Client Inquiries
                </h2>
                <p className="text-xs text-[#7C706D] font-sans">
                  Messages submitted via the contact form
                </p>
              </div>
              <Link
                href="/admin/contact"
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[#2B2625] hover:text-[#C39E96] transition-colors"
              >
                <span>View All</span>
                <HiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.recentContactsList.length === 0 ? (
              <div className="py-8 text-center text-[#7C706D] text-xs font-sans">
                No inquiries received yet. All new contact form submissions will appear here.
              </div>
            ) : (
              <div className="divide-y divide-[#E7DDD2]/70">
                {stats.recentContactsList.slice(0, 4).map((contact) => (
                  <div
                    key={contact._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2B2625]">{contact.name}</span>
                        {!contact.read && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-mono font-semibold">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[#7C706D] font-mono text-[11px] truncate">{contact.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {contact.createdAt && (
                        <span className="text-[11px] font-mono text-[#7C706D]">
                          {new Date(contact.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      <Link
                        href="/admin/contact"
                        className="px-2.5 py-1 bg-[#FAF6F3] hover:bg-[#F3ECE6] border border-[#E7DDD2] rounded-md text-[#2B2625] font-medium transition-colors text-[11px]"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Audit Log Preview */}
        <div className="bg-white rounded-2xl border border-[#E7DDD2] p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-4">
              <div className="space-y-0.5">
                <h2 className="font-serif text-base font-semibold text-[#2B2625]">
                  Recent Security & Audit Trail
                </h2>
                <p className="text-xs text-[#7C706D] font-sans">
                  Latest recorded administrator actions
                </p>
              </div>
              <Link
                href="/admin/audit-log"
                className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[#2B2625] hover:text-[#C39E96] transition-colors"
              >
                <span>Full Trail</span>
                <HiArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.recentAuditLogs.length === 0 ? (
              <div className="py-8 text-center text-[#7C706D] text-xs font-sans">
                No recent admin activity recorded.
              </div>
            ) : (
              <div className="divide-y divide-[#E7DDD2]/70">
                {stats.recentAuditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-[#2B2625] uppercase">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.status === 'success' ? (
                          <span className="text-[10px] text-emerald-700 font-medium">✓</span>
                        ) : (
                          <span className="text-[10px] text-rose-700 font-medium">✕</span>
                        )}
                      </div>
                      <p className="text-[#7C706D] font-mono text-[11px] truncate">
                        {log.adminEmail || 'System'}
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-[#7C706D] shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
