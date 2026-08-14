'use client';

import { useState, useEffect, useCallback } from 'react';
import { HiShieldExclamation, HiTrash, HiPlus, HiArrowPath, HiLockClosed } from 'react-icons/hi2';

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

export default function AdminSecurityPage() {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [attempts, setAttempts] = useState<BlockedAttempt[]>([]);
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchState = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/security', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blockedIps || []);
        setAttempts(data.recentAttempts || []);
        setAttemptCount(data.attemptCount || 0);
      } else {
        setMessage({ type: 'err', text: 'Failed to load security state.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to load security state.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const authHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleBlock = async () => {
    const ip = newIp.trim();
    if (!ip) return;
    setBusy(true);
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'block', ip, reason: newReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'ok', text: `IP ${ip} blocked.` });
        setNewIp('');
        setNewReason('');
        fetchState();
      } else {
        setMessage({ type: 'err', text: data.error || 'Failed to block IP.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to block IP.' });
    } finally {
      setBusy(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    if (!window.confirm(`Remove ${ip} from the admin blocklist?`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'unblock', ip }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ type: 'ok', text: data.message || `IP ${ip} unblocked.` });
        fetchState();
      } else {
        setMessage({ type: 'err', text: data.error || 'Failed to unblock IP.' });
      }
    } catch {
      setMessage({ type: 'err', text: 'Failed to unblock IP.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C39E96]">
            <HiShieldExclamation className="w-5 h-5" />
            <span className="font-mono text-xs uppercase tracking-widest font-semibold text-[#2B2625]">Admin Security</span>
          </div>
          <h1 className="font-serif text-2xl font-medium text-[#2B2625] mt-1">Blocked IP Addresses</h1>
          <p className="text-xs text-[#7C706D] mt-1">
            Blocked sources receive HTTP 403 on all admin pages and admin APIs, and are denied before the login flow. Blocking
            applies to a network / source IP, not to a physical device — the same device can change networks and obtain a new IP.
          </p>
        </div>
        <button
          onClick={fetchState}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-all"
        >
          <HiArrowPath className={`w-4 h-4 text-[#7C706D] ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`p-4 text-xs rounded-xl flex items-center gap-2 ${
            message.type === 'ok'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7DDD2]/40 bg-[#FAF6F3]/50 flex items-center justify-between">
          <span className="font-serif text-sm font-medium text-[#2B2625]">Blocked IPs ({blockedIps.length})</span>
          <span className="font-mono text-[10px] text-[#7C706D]">Stored in production database — persists across restarts</span>
        </div>

        <div className="p-4 border-b border-[#E7DDD2]/40">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="IP address to block (e.g. 203.0.113.10)"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E7DDD2] text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96]"
            />
            <input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 px-3 py-2 rounded-lg border border-[#E7DDD2] text-sm text-[#2B2625] focus:outline-none focus:border-[#C39E96]"
            />
            <button
              onClick={handleBlock}
              disabled={busy || !newIp.trim()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2B2625] text-white text-xs font-medium hover:bg-[#C39E96] transition-all disabled:opacity-40"
            >
              <HiPlus className="w-4 h-4" />
              Block IP
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#7C706D] text-xs font-mono">Loading security state...</div>
        ) : blockedIps.length === 0 ? (
          <div className="p-12 text-center text-[#7C706D] text-xs font-mono">No IPs are currently blocked.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6F3] border-b border-[#E7DDD2]/50 text-[#7C706D] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5 pl-6 font-semibold">IP Address</th>
                  <th className="p-3.5 font-semibold">Reason</th>
                  <th className="p-3.5 font-semibold">Blocked By</th>
                  <th className="p-3.5 font-semibold">Blocked At</th>
                  <th className="p-3.5 pr-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD2]/40">
                {blockedIps.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAF6F3]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-mono text-[11px] text-[#2B2625]">{item.ip}</td>
                    <td className="p-3.5 text-[#7C706D]">{item.reason || '-'}</td>
                    <td className="p-3.5 text-[#7C706D]">{item.blockedBy}</td>
                    <td className="p-3.5 text-[#7C706D] font-mono text-[11px]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      <button
                        onClick={() => handleUnblock(item.ip)}
                        disabled={busy}
                        className="text-rose-700 hover:text-rose-900 text-xs font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        <HiTrash className="w-3.5 h-3.5" />
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

      <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7DDD2]/40 bg-[#FAF6F3]/50 flex items-center justify-between">
          <span className="font-serif text-sm font-medium text-[#2B2625]">Blocked Access Attempts</span>
          <span className="font-mono text-[10px] text-[#7C706D]">{attemptCount} total attempt(s) logged</span>
        </div>
        {attempts.length === 0 ? (
          <div className="p-12 text-center text-[#7C706D] text-xs font-mono">No blocked access attempts logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6F3] border-b border-[#E7DDD2]/50 text-[#7C706D] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5 pl-6 font-semibold">IP</th>
                  <th className="p-3.5 font-semibold">Method / Path</th>
                  <th className="p-3.5 font-semibold">Reason</th>
                  <th className="p-3.5 pr-6 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD2]/40">
                {attempts.map((a) => (
                  <tr key={a._id} className="hover:bg-[#FAF6F3]/50 transition-colors">
                    <td className="p-3.5 pl-6 font-mono text-[11px] text-[#2B2625]">{a.ip}</td>
                    <td className="p-3.5 text-[#7C706D]">
                      <span className="inline-flex items-center gap-1">
                        <HiLockClosed className="w-3 h-3 text-rose-600" />
                        {a.method || '?'} {a.path || ''}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#7C706D]">{a.reason}</td>
                    <td className="p-3.5 text-[#7C706D] font-mono text-[11px]">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}
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
