'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  HiExclamationCircle,
  HiCalendarDays,
  HiArrowTrendingUp,
} from 'react-icons/hi2';

interface PageViewEntry {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  city?: string;
  sessionId: string;
  timestamp: string;
}

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  todayViews: number;
  weekViews?: number;
  monthViews?: number;
  deviceBreakdown: { mobile: number; tablet: number; desktop: number };
  browserBreakdown?: { browser: string; count: number }[];
  osBreakdown?: { os: string; count: number }[];
  referrerBreakdown?: { source: string; count: number }[];
  countryBreakdown?: { country: string; count: number }[];
  topPages: { path: string; count: number; percentage?: number }[];
  dailyTrends?: { date: string; views: number; visitors: number }[];
  recentActivity: PageViewEntry[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    weekViews: 0,
    monthViews: 0,
    deviceBreakdown: { mobile: 0, tablet: 0, desktop: 0 },
    browserBreakdown: [],
    osBreakdown: [],
    referrerBreakdown: [],
    countryBreakdown: [],
    topPages: [],
    dailyTrends: [],
    recentActivity: [],
  });

  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token')
          : null;
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

  // Filter recent activity based on selected dateRange
  const filteredActivity = useMemo(() => {
    if (!data.recentActivity) return [];
    if (dateRange === 'all') return data.recentActivity;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateRange === 'today') {
      return data.recentActivity.filter((act) => act.timestamp.startsWith(todayStr));
    }

    const cutoffDays = dateRange === '7d' ? 7 : 30;
    const cutoffTime = now.getTime() - cutoffDays * 24 * 60 * 60 * 1000;
    return data.recentActivity.filter((act) => new Date(act.timestamp).getTime() >= cutoffTime);
  }, [data.recentActivity, dateRange]);

  const totalDevices =
    data.deviceBreakdown.desktop + data.deviceBreakdown.mobile + data.deviceBreakdown.tablet || 1;

  const maxTrendViews = Math.max(...(data.dailyTrends || []).map((d) => d.views), 1);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#C39E96]">
            <HiChartBar className="w-5 h-5" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-[#7C706D]">
              Real-time Telemetry
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl text-[#2B2625] font-medium mt-1">
            Visitor & Portfolio Analytics
          </h1>
          <p className="font-sans text-xs text-[#7C706D] mt-1">
            Real visitor telemetry, top client gallery pages, device breakdown, and traffic referrers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Selector */}
          <div className="inline-flex p-1 bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/70">
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                dateRange === 'all' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                dateRange === '30d' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                dateRange === '7d' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                dateRange === 'today' ? 'bg-[#2B2625] text-white shadow-2xs' : 'text-[#7C706D] hover:text-[#2B2625]'
              }`}
            >
              Today
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-colors"
          >
            <HiArrowPath className={`w-4 h-4 text-[#C39E96] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <HiExclamationCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4"
        >
          <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/50">
            <HiEye className="w-6 h-6 text-[#C39E96]" />
          </div>
          <div>
            <p className="font-sans text-[11px] text-[#7C706D] font-medium uppercase tracking-wider">
              Total Page Views
            </p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.totalPageViews}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4"
        >
          <div className="p-3 bg-sky-50 text-sky-800 rounded-xl border border-sky-200/50">
            <HiUsers className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <p className="font-sans text-[11px] text-[#7C706D] font-medium uppercase tracking-wider">
              Unique Visitors
            </p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.uniqueVisitors}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/50">
            <HiClock className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-sans text-[11px] text-[#7C706D] font-medium uppercase tracking-wider">
              Today&apos;s Views
            </p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.todayViews}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex items-center gap-4"
        >
          <div className="p-3 bg-purple-50 text-purple-800 rounded-xl border border-purple-200/50">
            <HiArrowTrendingUp className="w-6 h-6 text-purple-700" />
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[11px] text-[#7C706D] font-medium uppercase tracking-wider">Past 7 Days</p>
            <p className="font-serif text-2xl text-[#2B2625] font-semibold">{data.weekViews || data.todayViews}</p>
          </div>
        </motion.div>
      </div>

      {/* 14-Day Activity Bar Chart / Trend */}
      {data.dailyTrends && data.dailyTrends.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-medium text-[#2B2625] flex items-center gap-2">
              <HiCalendarDays className="w-5 h-5 text-[#C39E96]" />
              14-Day Visitor Volume & Page Views
            </h2>
            <span className="font-mono text-[10px] text-[#7C706D] uppercase">Daily Trend</span>
          </div>

          <div className="h-36 flex items-end gap-2 pt-6 pb-2 border-b border-[#E7DDD2]/50">
            {data.dailyTrends.map((d, i) => {
              const heightPct = Math.max(Math.round((d.views / maxTrendViews) * 100), d.views > 0 ? 8 : 2);
              const dayLabel = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#2B2625] text-white text-[10px] py-1 px-2 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                    {dayLabel}: {d.views} views ({d.visitors} visitors)
                  </div>
                  <div
                    className="w-full bg-[#C39E96]/30 group-hover:bg-[#2B2625] rounded-t transition-colors"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[9px] font-mono text-[#7C706D] truncate w-full text-center">
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Visited Routes */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
          <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2">
            <HiGlobeAlt className="w-5 h-5 text-[#C39E96]" />
            Most Visited Portfolio Pages
          </h2>
          {data.topPages.length === 0 ? (
            <p className="font-sans text-xs text-[#7C706D] italic py-4">No page visits logged yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topPages.map((page, i) => {
                const pct =
                  page.percentage ?? Math.round((page.count / (data.totalPageViews || 1)) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-sans text-xs text-[#2B2625]">
                      <span className="font-mono text-[11px] truncate font-medium">{page.path}</span>
                      <span className="font-semibold text-[#7C706D]">
                        {page.count} views ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF6F3] h-2 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                      <div
                        className="bg-[#2B2625] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device & Traffic Sources */}
        <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-5">
          <div>
            <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2 mb-3">
              <HiComputerDesktop className="w-5 h-5 text-[#C39E96]" />
              Visitor Device Types
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiComputerDesktop className="w-4 h-4 text-stone-700" /> Desktop
                  </span>
                  <span className="font-semibold">
                    {data.deviceBreakdown.desktop} ({Math.round((data.deviceBreakdown.desktop / totalDevices) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                  <div
                    className="bg-stone-800 h-full rounded-full"
                    style={{ width: `${(data.deviceBreakdown.desktop / totalDevices) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiDevicePhoneMobile className="w-4 h-4 text-rose-700" /> Mobile
                  </span>
                  <span className="font-semibold">
                    {data.deviceBreakdown.mobile} ({Math.round((data.deviceBreakdown.mobile / totalDevices) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                  <div
                    className="bg-rose-700 h-full rounded-full"
                    style={{ width: `${(data.deviceBreakdown.mobile / totalDevices) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-sans text-[#2B2625] mb-1">
                  <span className="flex items-center gap-2">
                    <HiDeviceTablet className="w-4 h-4 text-sky-700" /> Tablet
                  </span>
                  <span className="font-semibold">
                    {data.deviceBreakdown.tablet} ({Math.round((data.deviceBreakdown.tablet / totalDevices) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-[#FAF6F3] h-2.5 rounded-full overflow-hidden border border-[#E7DDD2]/50">
                  <div
                    className="bg-sky-700 h-full rounded-full"
                    style={{ width: `${(data.deviceBreakdown.tablet / totalDevices) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traffic Sources */}
          {data.referrerBreakdown && data.referrerBreakdown.length > 0 && (
            <div className="pt-4 border-t border-[#E7DDD2]/60">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-2">
                Top Traffic Referrers
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {data.referrerBreakdown.map((ref, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-[#FAF6F3]/60 rounded-lg border border-[#E7DDD2]/50 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[#2B2625] truncate">{ref.source}</span>
                    <span className="font-mono text-[#7C706D]">{ref.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log Stream */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg text-[#2B2625] font-medium flex items-center gap-2">
            <HiClock className="w-5 h-5 text-[#C39E96]" />
            Recent Visitor Activity Stream ({filteredActivity.length})
          </h2>
          <span className="font-mono text-[10px] text-[#7C706D]">Live Page Telemetry</span>
        </div>

        {filteredActivity.length === 0 ? (
          <p className="font-sans text-xs text-[#7C706D] italic py-6 text-center">
            No visitor views recorded for the selected timeframe.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Page Visited</th>
                  <th className="py-2.5 px-3">Device & Browser</th>
                  <th className="py-2.5 px-3">Referrer</th>
                  <th className="py-2.5 px-3 text-right">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD2]/50">
                {filteredActivity.slice(0, 30).map((act, i) => (
                  <tr key={i} className="hover:bg-[#FAF6F3]/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#7C706D] whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs font-medium text-[#2B2625]">{act.path}</td>
                    <td className="py-2.5 px-3 text-[#7C706D]">
                      <div className="flex items-center gap-1.5">
                        {act.device === 'mobile' ? (
                          <HiDevicePhoneMobile className="w-3.5 h-3.5 text-rose-700" />
                        ) : (
                          <HiComputerDesktop className="w-3.5 h-3.5 text-stone-700" />
                        )}
                        <span>
                          {act.browser || 'Browser'} ({act.os || 'OS'})
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#7C706D] text-[11px] truncate max-w-xs">
                      {act.referrer ? act.referrer.replace(/^https?:\/\//, '') : 'Direct'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-[#7C706D]">
                      {act.city ? `${act.city}, ${act.country || 'IN'}` : act.country || 'India'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
