'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HiShieldCheck,
  HiShieldExclamation,
  HiTrash,
  HiPlus,
  HiArrowPath,
  HiLockClosed,
  HiCheckCircle,
  HiXCircle,
  HiGlobeAlt,
  HiComputerDesktop,
  HiDevicePhoneMobile,
  HiKey,
  HiNoSymbol,
  HiClipboardDocumentList,
} from 'react-icons/hi2';

interface BlockedIp {
  _id: string;
  ip: string;
  reason: string;
  blockedBy: string;
  createdAt: string;
}

interface BlockedAttempt {
  _id: string;
  ip: string;
  path: string;
  method: string;
  reason: string;
  createdAt: string;
}

interface LoginLogItem {
  _id: string;
  email: string;
  ip: string;
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  status: 'success' | 'failed' | 'revoked';
  sessionId?: string;
  loginTime: string;
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'ip_blocklist' | 'interceptions'>('sessions');

  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);

  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [secRes, logRes] = await Promise.all([
        fetch('/api/security', { headers, cache: 'no-store' }),
        fetch('/api/auth/access-logs', { headers, cache: 'no-store' }),
      ]);

      if (secRes.ok) {
        const secData = await secRes.json();
        setBlockedIps(secData.blockedIps || []);
        setAttempts(secData.recentAttempts || []);
        setAttemptCount(secData.attemptCount || 0);
      }

      if (logRes.ok) {
        const logData = await logRes.json();
        setLoginLogs(logData.logs || []);
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to load security telemetry.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const authHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = newIp.trim();
    if (!ip) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'block', ip, reason: newReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'ok', text: `IP ${ip} has been blocked from all admin surfaces.` });
        setNewIp('');
        setNewReason('');
        fetchSecurityData();
      } else {
        setMessage({ type: 'err', text: data.error || 'Failed to block IP address.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to block IP address.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    if (!window.confirm(`Remove ${ip} from the admin shield blocklist?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'unblock', ip }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'ok', text: data.message || `IP ${ip} unblocked successfully.` });
        fetchSecurityData();
      } else {
        setMessage({ type: 'err', text: data.error || 'Failed to unblock IP.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to unblock IP.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm(`Revoke session ${sessionId}? This administrator will be signed out.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/access-logs', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'revoke_session', sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'ok', text: `Session ${sessionId} was revoked.` });
        fetchSecurityData();
      } else {
        setMessage({ type: 'err', text: data.error || 'Failed to revoke session.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to revoke session.' });
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Globally revoke ALL active administrator sessions? You will be signed out immediately.')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/access-logs', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'revoke_all' }),
      });
      if (res.ok) {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin/login';
      }
    } catch {
      alert('Revocation failed.');
    } finally {
      setBusy(false);
    }
  };

  const activeSessionsCount = loginLogs.filter((l) => l.status === 'success').length;
  const failedLoginsCount = loginLogs.filter((l) => l.status === 'failed').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C39E96]">
            <HiShieldCheck className="w-5 h-5" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-[#7C706D]">
              Indira Thakur Studio Security
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] mt-1">
            Security & Login Activity
          </h1>
          <p className="text-xs text-[#7C706D] mt-1">
            Real-time audit telemetry, active admin sessions, brute-force mitigation, and IP access rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSecurityData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-all shadow-2xs"
          >
            <HiArrowPath className={`w-4 h-4 text-[#7C706D] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'ok' ? (
              <HiCheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <HiXCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7C706D]">Active Sessions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 font-serif text-2xl font-medium text-[#2B2625]">{activeSessionsCount}</div>
          <span className="text-[11px] text-[#7C706D] mt-0.5 block">Logged-in admins</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7C706D]">Failed Logins</span>
            <HiLockClosed className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 font-serif text-2xl font-medium text-amber-700">{failedLoginsCount}</div>
          <span className="text-[11px] text-[#7C706D] mt-0.5 block">Rejected attempts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7C706D]">Blocked IPs</span>
            <HiNoSymbol className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 font-serif text-2xl font-medium text-rose-700">{blockedIps.length}</div>
          <span className="text-[11px] text-[#7C706D] mt-0.5 block">Active IP bans</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#7C706D]">Interceptions</span>
            <HiShieldExclamation className="w-4 h-4 text-[#C39E96]" />
          </div>
          <div className="mt-2 font-serif text-2xl font-medium text-[#2B2625]">{attemptCount}</div>
          <span className="text-[11px] text-[#7C706D] mt-0.5 block">Shielded 403 blocks</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E7DDD2] flex items-center gap-6">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'sessions'
              ? 'border-[#2B2625] text-[#2B2625]'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
          }`}
        >
          Login History & Sessions ({loginLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('ip_blocklist')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'ip_blocklist'
              ? 'border-[#2B2625] text-[#2B2625]'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
          }`}
        >
          IP Shield Blocklist ({blockedIps.length})
        </button>
        <button
          onClick={() => setActiveTab('interceptions')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'interceptions'
              ? 'border-[#2B2625] text-[#2B2625]'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
          }`}
        >
          Shield Interceptions ({attempts.length})
        </button>
      </div>

      {/* TAB 1: LOGIN HISTORY & ACTIVE SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* Global Session Revocation Card */}
          <div className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-medium text-xs text-[#2B2625] flex items-center gap-2">
                <HiKey className="w-4 h-4 text-rose-600" />
                Global Session Revocation
              </h3>
              <p className="text-[11px] text-[#7C706D] mt-0.5">
                Revoke all active administrator sessions across all devices in MongoDB Atlas.
              </p>
            </div>
            <button
              onClick={handleRevokeAllSessions}
              disabled={busy}
              className="px-4 py-2 bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 rounded-lg transition-all shadow-2xs flex-shrink-0"
            >
              Revoke All Active Sessions
            </button>
          </div>

          {/* Login Logs Table */}
          <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E7DDD2]/60 bg-[#FAF6F3]/50 flex items-center justify-between">
              <h3 className="font-serif text-sm font-medium text-[#2B2625]">
                Recent Authentication & Session History
              </h3>
              <span className="text-[10px] font-mono text-[#7C706D]">Live Mongo Auth Stream</span>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : loginLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7C706D]">No login records logged yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Admin Account</th>
                      <th className="py-3 px-4">Client / Device</th>
                      <th className="py-3 px-4">Network IP & Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DDD2]/60">
                    {loginLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#FAF6F3]/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-[#7C706D] whitespace-nowrap">
                          {new Date(log.loginTime).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#2B2625]">{log.email}</td>
                        <td className="py-3 px-4 text-[#7C706D]">
                          <div className="flex items-center gap-1.5">
                            {log.device === 'mobile' ? (
                              <HiDevicePhoneMobile className="w-4 h-4 text-[#7C706D]" />
                            ) : (
                              <HiComputerDesktop className="w-4 h-4 text-[#7C706D]" />
                            )}
                            <span>{log.browser || 'Unknown Browser'} ({log.os || 'Unknown OS'})</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] text-[#2B2625] bg-[#FAF6F3] px-1.5 py-0.5 rounded border border-[#E7DDD2]/60">
                            {log.ip}
                          </span>
                          <span className="text-[11px] text-[#7C706D] block mt-0.5">{log.location || 'Mumbai, MH'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Active Session
                            </span>
                          ) : log.status === 'revoked' ? (
                            <span className="inline-flex items-center gap-1 text-[#7C706D] font-medium">
                              <HiLockClosed className="w-4 h-4 text-[#7C706D]" /> Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                              <HiXCircle className="w-4 h-4 text-rose-600" /> Failed Attempt
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {log.status === 'success' && log.sessionId && (
                            <button
                              onClick={() => handleRevokeSession(log.sessionId!)}
                              disabled={busy}
                              className="text-[11px] px-2.5 py-1 bg-white border border-[#E7DDD2] text-rose-700 hover:bg-rose-50 rounded-md transition-all font-medium"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IP SHIELD BLOCKLIST */}
      {activeTab === 'ip_blocklist' && (
        <div className="space-y-6">
          {/* Add Block Form */}
          <div className="bg-white p-5 rounded-xl border border-[#E7DDD2]/60 shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-medium text-[#2B2625] flex items-center gap-2">
              <HiPlus className="w-4 h-4 text-[#C39E96]" />
              Block an IP Address
            </h3>

            <form onSubmit={handleBlock} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  IPv4 or IPv6 Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 203.0.113.42"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-xs font-mono text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#7C706D] mb-1">
                  Reason for Block
                </label>
                <input
                  type="text"
                  placeholder="e.g. Repeated unauthorized login attempts"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2 bg-rose-700 text-white text-xs font-medium rounded-lg hover:bg-rose-800 transition-colors disabled:opacity-50"
                >
                  {busy ? 'Blocking...' : 'Block IP'}
                </button>
              </div>
            </form>
          </div>

          {/* Blocklist Table */}
          <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E7DDD2]/60 bg-[#FAF6F3]/50 flex items-center justify-between">
              <h3 className="font-serif text-sm font-medium text-[#2B2625]">Currently Blocked IP Addresses</h3>
              <span className="text-[10px] font-mono text-[#7C706D]">{blockedIps.length} Active Rules</span>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : blockedIps.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#7C706D]">
                No IP addresses are currently blocked. The admin shield is healthy.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Blocked By</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DDD2]/60">
                    {blockedIps.map((b) => (
                      <tr key={b._id} className="hover:bg-[#FAF6F3]/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-rose-800">{b.ip}</td>
                        <td className="py-3 px-4 text-[#2B2625]">{b.reason}</td>
                        <td className="py-3 px-4 text-[#7C706D] text-[11px]">{b.blockedBy}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#7C706D]">
                          {new Date(b.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleUnblock(b.ip)}
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-[#E7DDD2] text-[#2B2625] hover:border-emerald-600 hover:text-emerald-700 rounded-md text-[11px] font-medium transition-all"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SHIELD INTERCEPTIONS */}
      {activeTab === 'interceptions' && (
        <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#E7DDD2]/60 bg-[#FAF6F3]/50 flex items-center justify-between">
            <h3 className="font-serif text-sm font-medium text-[#2B2625]">
              Shield Interception Audit (403 Blocks)
            </h3>
            <span className="text-[10px] font-mono text-[#7C706D]">{attempts.length} Recorded Attempts</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7C706D]">
              No intercepted requests logged from blocked IPs.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] font-mono uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Source IP</th>
                    <th className="py-3 px-4">Target Path</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DDD2]/60">
                  {attempts.map((att) => (
                    <tr key={att._id} className="hover:bg-[#FAF6F3]/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#7C706D]">
                        {new Date(att.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-rose-700">{att.ip}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#2B2625]">{att.path}</td>
                      <td className="py-3 px-4 font-mono text-[10px] uppercase font-bold text-[#7C706D]">
                        {att.method}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium font-mono text-[11px]">
                          <HiNoSymbol className="w-3.5 h-3.5 text-rose-600" /> HTTP 403 Forbidden
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
