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
  HiCloudArrowUp,
  HiPlay,
  HiFolder,
  HiInformationCircle,
  HiPhoto,
  HiArrowTopRightOnSquare,
  HiExclamationCircle,
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
  const [activeTab, setActiveTab] = useState<'sessions' | 'ip_blocklist' | 'interceptions' | 'migration'>('sessions');

  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);

  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [busy, setBusy] = useState(false);

  // Storage & Cloudflare R2 Migration State
  const [migrationData, setMigrationData] = useState<any>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

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

  const fetchMigrationStatus = useCallback(async () => {
    setMigrationLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/migrate-r2', { headers, cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setMigrationData(json);
      }
    } catch (err: any) {
      console.warn('Migration status fetch error:', err);
    } finally {
      setMigrationLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  useEffect(() => {
    if (activeTab === 'migration' && !migrationData) {
      fetchMigrationStatus();
    }
  }, [activeTab, migrationData, fetchMigrationStatus]);

  const handleRunMigration = async (action: 'seed_all' | 'test') => {
    setMigrationBusy(true);
    setMigrationError(null);
    setMigrationResult(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch('/api/migrate-r2', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && !json.testMode) {
        setMigrationError(json.error || 'Migration request failed.');
      } else {
        setMigrationResult(json);
      }
      await fetchMigrationStatus();
    } catch (err: any) {
      setMigrationError(err.message || 'Error executing migration operation.');
    } finally {
      setMigrationBusy(false);
    }
  };

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
        <button
          onClick={() => setActiveTab('migration')}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'migration'
              ? 'border-[#2B2625] text-[#2B2625]'
              : 'border-transparent text-[#7C706D] hover:text-[#2B2625]'
          }`}
        >
          Cloudflare R2 Migration
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

      {/* TAB 4: CLOUDFLARE R2 MIGRATION */}
      {activeTab === 'migration' && (
        <div className="space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cloudflare R2 Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E7DDD2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      migrationData?.r2Configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <h2 className="font-serif text-lg font-medium text-[#2B2625]">Cloudflare R2 Storage</h2>
                </div>
                {migrationData?.r2Configured ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Active & Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <HiInformationCircle className="w-4 h-4 text-amber-600" /> Configuration Pending
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
                  <span className="text-[#7C706D]">Target Bucket:</span>
                  <span className="font-mono font-medium text-[#2B2625]">
                    {migrationData?.r2Bucket || 'indira-thakur-media'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
                  <span className="text-[#7C706D]">Verified R2 Objects:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {migrationData?.r2TotalObjects !== undefined
                      ? `${migrationData.r2TotalObjects} Objects`
                      : '0 Objects'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
                  <span className="text-[#7C706D]">Media Streaming Pipeline:</span>
                  <span className="font-mono font-medium text-[#2B2625]">
                    Proxy Gateway (/api/media/*)
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#7C706D]">Zero Egress Fees:</span>
                  <span className="text-emerald-700 font-semibold">Enabled via Cloudflare R2</span>
                </div>
              </div>

              {!migrationData?.r2Configured && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1.5">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <HiInformationCircle className="w-4 h-4 text-amber-600" />
                    Required Environment Variables
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Define Cloudflare credentials in your environment variables to enable direct R2 writes:
                  </p>
                  <code className="block bg-white/80 p-2 rounded text-[10px] font-mono text-amber-950 border border-amber-200/60 overflow-x-auto">
                    CLOUDFLARE_ACCOUNT_ID=...<br />
                    R2_ACCESS_KEY_ID=...<br />
                    R2_SECRET_ACCESS_KEY=...<br />
                    R2_BUCKET_NAME=indira-thakur-media
                  </code>
                </div>
              )}
            </div>

            {/* Supabase Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E7DDD2] shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
                <h2 className="font-serif text-lg font-medium text-[#2B2625]">Supabase Legacy Storage</h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <HiExclamationCircle className="w-4 h-4 text-rose-600" /> Quota Exceeded (HTTP 402)
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#7C706D]">
                <p>
                  <strong className="text-[#2B2625]">Status Notice:</strong> Supabase project bandwidth has exceeded the free plan quota (<code className="font-mono text-[11px]">exceed_cached_egress_quota</code>).
                </p>
                <p>
                  <strong className="text-[#2B2625]">Zero-Downtime Guarantee:</strong> High-resolution local repository backups and Cloudflare R2 proxies safeguard your site, ensuring no broken images are served to visitors.
                </p>
                <p>
                  <strong className="text-[#2B2625]">Data Safety:</strong> All files in Supabase remain untouched and safe in the cloud.
                </p>
              </div>

              <div className="p-3 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2] text-xs text-[#2B2625] flex items-center justify-between">
                <span className="font-medium">Total Tracked Assets:</span>
                <span className="font-mono font-bold text-sm text-[#C39E96]">
                  {migrationData?.totalKnownAssets || 27}
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-[#FAF6F3] border border-[#E7DDD2] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif text-base font-medium text-[#2B2625]">
                Asset Migration & Diagnostic Controls
              </h3>
              <p className="text-xs text-[#7C706D]">
                Verify fallback asset health or migrate all media records to Cloudflare R2 and update database pointers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchMigrationStatus}
                disabled={migrationLoading || migrationBusy}
                className="px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors flex items-center gap-1.5"
              >
                <HiArrowPath className={`w-3.5 h-3.5 ${migrationLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>

              <button
                type="button"
                onClick={() => handleRunMigration('test')}
                disabled={migrationBusy}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white border border-[#C39E96] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors flex items-center gap-1.5"
              >
                {migrationBusy ? (
                  <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" />
                ) : (
                  <HiPlay className="w-3.5 h-3.5 text-[#C39E96]" />
                )}
                Run Diagnostic Probe
              </button>

              <button
                type="button"
                onClick={() => handleRunMigration('seed_all')}
                disabled={migrationBusy || !migrationData?.r2Configured}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 shadow-2xs transition-all ${
                  !migrationData?.r2Configured
                    ? 'bg-gray-400 cursor-not-allowed opacity-75'
                    : migrationBusy
                    ? 'bg-[#A89F91] cursor-wait'
                    : 'bg-[#2B2625] hover:bg-[#3D3534]'
                }`}
              >
                {migrationBusy ? (
                  <>
                    <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" />
                    Processing Migration...
                  </>
                ) : (
                  <>
                    <HiCloudArrowUp className="w-4 h-4 text-[#C39E96]" />
                    Migrate to Cloudflare R2
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {migrationError && (
            <div className="p-4 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2.5">
              <HiExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{migrationError}</span>
            </div>
          )}

          {/* Results Summary Banner */}
          {migrationResult && (
            <div className="p-5 rounded-2xl bg-white border border-[#E7DDD2] shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#FAF6F3] pb-3">
                <div className="flex items-center gap-2 font-serif text-base font-medium text-[#2B2625]">
                  <HiCheckCircle className="w-5 h-5 text-emerald-600" />
                  <span>
                    {migrationResult.testMode ? 'Diagnostic Probe Summary' : 'Migration Operation Finished'}
                  </span>
                </div>
                {migrationResult.summary?.databaseReferencesUpdated > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                    {migrationResult.summary.databaseReferencesUpdated} Database References Updated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-center">
                <div className="bg-[#FAF6F3] p-2.5 rounded-xl border border-[#E7DDD2]">
                  <span className="block text-[#2B2625] font-bold text-base">
                    {migrationResult.summary?.totalProcessed ?? 0}
                  </span>
                  <span className="text-[10px] text-[#7C706D] uppercase">Audited</span>
                </div>
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60">
                  <span className="block text-emerald-700 font-bold text-base">
                    {migrationResult.summary?.migratedToR2 ?? 0}
                  </span>
                  <span className="text-[10px] text-emerald-800 uppercase">Uploaded to R2</span>
                </div>
                <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="block text-amber-700 font-bold text-base">
                    {migrationResult.summary?.alreadyInR2 ?? 0}
                  </span>
                  <span className="text-[10px] text-amber-800 uppercase">Already in R2</span>
                </div>
                <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/60">
                  <span className="block text-rose-700 font-bold text-base">
                    {migrationResult.summary?.blockedBySupabase402 ?? 0}
                  </span>
                  <span className="text-[10px] text-rose-800 uppercase">Blocked (402)</span>
                </div>
                <div className="bg-sky-50/60 p-2.5 rounded-xl border border-sky-200/60">
                  <span className="block text-sky-800 font-bold text-base">
                    {migrationResult.summary?.databaseReferencesUpdated ?? 0}
                  </span>
                  <span className="text-[10px] text-sky-800 uppercase">DB Updated</span>
                </div>
              </div>

              {migrationResult.summary?.statusMessage && (
                <p className="text-[11px] text-[#7C706D] italic pt-1">
                  {migrationResult.summary.statusMessage}
                </p>
              )}
            </div>
          )}

          {/* Asset Audit Table */}
          <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-[#E7DDD2] flex items-center justify-between">
              <h3 className="font-serif text-base font-medium text-[#2B2625] flex items-center gap-2">
                <HiFolder className="w-4 h-4 text-[#C39E96]" />
                Audited Media Assets Inventory
              </h3>
              <span className="text-xs text-[#7C706D]">
                {(migrationResult?.results || migrationData?.assets || []).length} Assets Cataloged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/70 text-[#7C706D] font-mono uppercase text-[10px]">
                    <th className="p-3 font-medium">Folder & Key</th>
                    <th className="p-3 font-medium">Source / Origin</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Size / Note</th>
                    <th className="p-3 font-medium">Public Delivery URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DDD2]/60 font-sans">
                  {(migrationResult?.results || migrationData?.assets || []).map(
                    (asset: any, i: number) => (
                      <tr key={asset.key || i} className="hover:bg-[#FAF6F3]/40 transition-colors">
                        <td className="p-3 font-mono font-medium text-[#2B2625] max-w-[220px] truncate">
                          <span className="text-[10px] text-[#C39E96] font-sans font-semibold uppercase block">
                            {asset.folder || (asset.key ? asset.key.split('/')[0] : 'root')}
                          </span>
                          {asset.key}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#7C706D] max-w-[200px] truncate">
                          {asset.sourceUrl}
                        </td>
                        <td className="p-3">
                          {asset.status === 'MIGRATED' ||
                          asset.status === 'MIGRATED_FROM_LOCAL' ||
                          asset.status === 'MIGRATED_FROM_CLOUDINARY' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <HiCheckCircle className="w-3 h-3 text-emerald-600" /> Migrated
                            </span>
                          ) : asset.status === 'ALREADY_EXISTS' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <HiCheckCircle className="w-3 h-3 text-amber-600" /> In R2
                            </span>
                          ) : asset.status === 'BLOCKED_402' ||
                            asset.status === 'BLOCKED_BY_SUPABASE_402' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <HiExclamationCircle className="w-3 h-3 text-rose-600" /> HTTP 402 Quota
                            </span>
                          ) : asset.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                              <HiPhoto className="w-3 h-3 text-sky-600" /> Verified Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                              {asset.status}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#7C706D] max-w-[200px] truncate">
                          {asset.bytes
                            ? `${(asset.bytes / 1024).toFixed(1)} KB`
                            : asset.reason || '—'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-[#C39E96]">
                          {asset.r2Url ? (
                            <a
                              href={asset.r2Url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:underline text-[#2B2625]"
                            >
                              <span className="max-w-[140px] truncate">{asset.r2Url}</span>
                              <HiArrowTopRightOnSquare className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
