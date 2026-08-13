'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  HiChartBar, 
  HiEye, 
  HiUsers, 
  HiClock, 
  HiGlobeAlt, 
  HiComputerDesktop, 
  HiDevicePhoneMobile, 
  HiDeviceTablet,
  HiArrowPath,
  HiExclamationCircle
} from 'react-icons/hi2';

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  todayViews: number;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  topPages: { path: string; count: number }[];
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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
    topPages: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('admin_token') || localStorage.getItem('auth_token')) : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/analytics/stats', { headers, credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch analytics statistics');
      const stats = await res.json();
      setData(stats);
    } catch (err: any) {
      setError(err?.message || 'Error loading visitor analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const totalDevices = (data.deviceBreakdown.desktop + data.deviceBreakdown.mobile + data.deviceBreakdown.tablet) || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <h1 className="font-serif text-2xl text-[#2B2625] font-normal flex items-center gap-3">
            <HiChartBar className="w-6 h-6 text-[#C39E96]" />
            Production Visitor Analytics
          </h1>
          <p className="font-sans text-xs text-[#7C706D] mt-1">
            Real-time traffic metrics, top performing portfolio pages, and device distributions.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-colors self-start sm:self-auto"
        >
          <HiArrowPath className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <HiExclamationCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <HiEye className="w-6 h-6" />
          </div>
          <div>
            <p className="font-sans text-xs text-[#7C706D] font-medium uppercase tracking-wider">Total Page Views</p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.totalPageViews}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-sky-100 text-sky-800 rounded-xl">
            <HiUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="font-sans text-xs text-[#7C706D] font-medium uppercase tracking-wider">Unique Visitors</p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.uniqueVisitors}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <HiClock className="w-6 h-6" />
          </div>
          <div>
            <p className="font-sans text-xs text-[#7C706D] font-medium uppercase tracking-wider">Today&apos;s Views</p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.todayViews}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-xl">
            <HiGlobeAlt className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="font-sans text-xs text-[#7C706D] font-medium uppercase tracking-wider">Top Route</p>
            <p className="font-serif text-base text-[#2B2625] font-semibold truncate">{data.topPages[0]?.path || '/'}</p>
          </div>
        </motion.div>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Visited Routes */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2">
            <HiGlobeAlt className="w-5 h-5 text-[#C39E96]" />
            Most Visited Pages
          </h2>
          {data.topPages.length === 0 ? (
            <p className="font-sans text-xs text-[#7C706D] italic py-4">No page visits logged yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topPages.map((page, i) => {
                const pct = Math.round((page.count / (data.totalPageViews || 1)) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-sans text-xs text-[#2B2625]">
                      <span className="font-mono text-[11px] truncate">{page.path}</span>
                      <span className="font-semibold">{page.count} views ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF6F3] h-2 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                      <div className="bg-[#2B2625] h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2">
            <HiComputerDesktop className="w-5 h-5 text-[#C39E96]" />
            Visitor Device Types
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                <span className="flex items-center gap-2"><HiComputerDesktop className="w-4 h-4 text-stone-700" /> Desktop</span>
                <span className="font-semibold">{data.deviceBreakdown.desktop} ({Math.round((data.deviceBreakdown.desktop / totalDevices) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                <div className="bg-stone-800 h-full rounded-full" style={{ width: `${(data.deviceBreakdown.desktop / totalDevices) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                <span className="flex items-center gap-2"><HiDevicePhoneMobile className="w-4 h-4 text-rose-700" /> Mobile</span>
                <span className="font-semibold">{data.deviceBreakdown.mobile} ({Math.round((data.deviceBreakdown.mobile / totalDevices) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                <div className="bg-rose-700 h-full rounded-full" style={{ width: `${(data.deviceBreakdown.mobile / totalDevices) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                <span className="flex items-center gap-2"><HiDeviceTablet className="w-4 h-4 text-sky-700" /> Tablet</span>
                <span className="font-semibold">{data.deviceBreakdown.tablet} ({Math.round((data.deviceBreakdown.tablet / totalDevices) * 100)}%)</span>
              </div>
              <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                <div className="bg-sky-700 h-full rounded-full" style={{ width: `${(data.deviceBreakdown.tablet / totalDevices) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Stream */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
        <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2">
          <HiClock className="w-5 h-5 text-[#C39E96]" />
          Recent Visitor Traffic Stream
        </h2>
        {data.recentActivity.length === 0 ? (
          <p className="font-sans text-xs text-[#7C706D] italic py-2">No active visitor sessions recorded yet.</p>
        ) : (
          <div className="divide-y divide-[#E7DDD2]/40 max-h-80 overflow-y-auto">
            {data.recentActivity.map((act, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625]">
                    {act.device === 'mobile' ? <HiDevicePhoneMobile className="w-4 h-4 text-rose-700" /> : <HiComputerDesktop className="w-4 h-4 text-stone-700" />}
                  </span>
                  <div>
                    <p className="font-mono text-xs text-[#2B2625]">{act.path}</p>
                    <p className="text-[10px] text-[#7C706D] font-mono">{act.browser} on {act.os}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#7C706D]">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
