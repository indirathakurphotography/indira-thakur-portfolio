'use client';

import { useState, useEffect } from 'react';
import { 
  HiShieldCheck, 
  HiArrowPath, 
  HiComputerDesktop, 
  HiDevicePhoneMobile, 
  HiExclamationTriangle,
  HiTrash,
  HiKey
} from 'react-icons/hi2';

interface AccessLog {
  _id: string;
  email: string;
  ip: string;
  browser: string;
  os: string;
  device: string;
  location: string;
  status: 'success' | 'failed' | 'revoked';
  sessionId: string;
  loginTime: string;
  logoutTime?: string;
}

export default function AccessLogPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/auth/access-logs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to revoke ALL active admin sessions globally? Every logged in user (including you) will be forced to log in again.')) {
      return;
    }

    setRevoking(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/auth/access-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'revoke_all' }),
      });

      if (res.ok) {
        setActionMessage('All admin sessions invalidated successfully. Redirecting to login...');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 1500);
      } else {
        alert('Failed to revoke sessions.');
      }
    } catch {
      alert('An error occurred during global session revocation.');
    } finally {
      setRevoking(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/auth/access-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'revoke_session', sessionId }),
      });

      if (res.ok) {
        setLogs(prev => prev.map(l => l.sessionId === sessionId ? { ...l, status: 'revoked' } : l));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C39E96]">
            <HiShieldCheck className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold text-[#2B2625]">Security Audit & Active Sessions</span>
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#2B2625] mt-1">Admin Access Logs</h1>
          <p className="text-xs text-[#7C706D] mt-1">
            Monitor real-time login activity, devices, browser types, IP addresses, and manage server-side session revocations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-all"
          >
            <HiArrowPath className={`w-4 h-4 text-[#7C706D] ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleRevokeAllSessions}
            disabled={revoking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-medium hover:bg-rose-800 transition-all shadow-xs"
          >
            <HiKey className="w-4 h-4" />
            Revoke ALL Active Sessions
          </button>
        </div>
      </div>

      <div className="p-3 bg-[#FAF6F3] border border-[#E7DDD2] rounded-xl text-xs text-[#7C706D] flex items-center gap-2">
        <HiShieldCheck className="w-4 h-4 text-[#C39E96] shrink-0" />
        <span>Note: IP geolocation resolves to your internet provider's regional routing hub and may display neighbor states or major metro nodes rather than exact street locations.</span>
      </div>

      {actionMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
          <HiExclamationTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7DDD2]/40 bg-[#FAF6F3]/50 flex items-center justify-between">
          <span className="font-serif text-sm font-medium text-[#2B2625]">Recent Login Activity ({logs.length})</span>
          <span className="font-mono text-[10px] text-[#7C706D]">Server Time: {new Date().toLocaleString()}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#7C706D] text-xs font-mono">Loading access logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#7C706D] text-xs font-mono">No security logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6F3] border-b border-[#E7DDD2]/50 text-[#7C706D] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5 pl-6 font-semibold">User / Email</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold">Device / OS</th>
                  <th className="p-3.5 font-semibold">Browser</th>
                  <th className="p-3.5 font-semibold">IP Address & Location</th>
                  <th className="p-3.5 font-semibold">Timestamp</th>
                  <th className="p-3.5 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD2]/40">
                {logs.map((log) => (
                  <tr key={log._id || log.sessionId} className="hover:bg-[#FAF6F3]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-medium text-[#2B2625]">
                      <div className="flex flex-col">
                        <span>{log.email}</span>
                        <span className="font-mono text-[9px] text-[#7C706D] truncate max-w-[140px]">{log.sessionId}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : log.status === 'revoked'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#2B2625]">
                      <div className="flex items-center gap-1.5">
                        {log.device === 'Mobile' ? (
                          <HiDevicePhoneMobile className="w-4 h-4 text-[#7C706D]" />
                        ) : (
                          <HiComputerDesktop className="w-4 h-4 text-[#7C706D]" />
                        )}
                        <span>{log.os} ({log.device})</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#7C706D]">{log.browser}</td>
                    <td className="p-3.5 text-[#2B2625]">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px]">{log.ip}</span>
                        <span className="text-[10px] text-[#7C706D]" title="IP geolocation provides approximate regional location based on ISP routing.">
                          Approx. Location (IP-based): {log.location || 'India'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-[#7C706D] font-mono text-[11px]">
                      {new Date(log.loginTime).toLocaleString()}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      {log.status === 'success' && (
                        <button
                          onClick={() => handleRevokeSingleSession(log.sessionId)}
                          className="text-rose-700 hover:text-rose-900 text-xs font-medium inline-flex items-center gap-1 hover:underline"
                          title="Revoke session token"
                        >
                          <HiTrash className="w-3.5 h-3.5" />
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
  );
}
