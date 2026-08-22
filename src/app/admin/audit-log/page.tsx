'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiClipboardDocumentList,
  HiArrowPath,
  HiShieldCheck,
  HiKey,
  HiUserPlus,
  HiTrash,
  HiPencilSquare,
  HiNoSymbol,
  HiCheckCircle,
  HiXCircle,
  HiMagnifyingGlass,
  HiFunnel,
  HiClock,
} from 'react-icons/hi2';

interface AuditLogEntry {
  _id: string;
  action: string;
  adminEmail: string;
  adminName?: string;
  targetResource?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  status: 'success' | 'failure';
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/audit-logs', { headers, cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load administrative audit logs');
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Unique actions list for dropdown
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered entries
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const emailMatch = log.adminEmail?.toLowerCase().includes(q);
        const nameMatch = log.adminName?.toLowerCase().includes(q);
        const actionMatch = log.action?.toLowerCase().includes(q);
        const ipMatch = log.ip?.toLowerCase().includes(q);
        const resourceMatch = log.targetResource?.toLowerCase().includes(q);
        return emailMatch || nameMatch || actionMatch || ipMatch || resourceMatch;
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  const getActionBadge = (action: string) => {
    if (action.includes('login_failed') || action.includes('block')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('login_success') || action.includes('unblock')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('password') || action.includes('revoke')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (action.includes('user_create') || action.includes('user_update')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    return 'bg-[#FAF6F3] text-[#2B2625] border-[#E7DDD2]';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login_failed') || action.includes('block')) {
      return <HiNoSymbol className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
    }
    if (action.includes('login_success')) {
      return <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    }
    if (action.includes('password') || action.includes('revoke')) {
      return <HiKey className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    }
    if (action.includes('user_create')) {
      return <HiUserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
    if (action.includes('user_delete')) {
      return <HiTrash className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
    }
    return <HiShieldCheck className="w-3.5 h-3.5 text-[#C39E96] shrink-0" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C39E96]">
            <HiClipboardDocumentList className="w-5 h-5" />
            <span className="font-mono text-[10px] uppercase tracking-widest font-semibold text-[#7C706D]">
              System Governance
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] mt-1">
            Admin Audit Trail
          </h1>
          <p className="text-xs text-[#7C706D] mt-1">
            Immutable log of administrative events, security actions, permission changes, and access modifications.
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FAF6F3] border border-[#E7DDD2] text-[#2B2625] text-xs font-medium hover:bg-white transition-all self-start md:self-auto shadow-2xs"
        >
          <HiArrowPath className={`w-4 h-4 text-[#7C706D] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <HiXCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E7DDD2]/60 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-2.5 text-[#7C706D]" />
          <input
            type="text"
            placeholder="Search by admin email, action, IP, or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] placeholder:text-[#7C706D]/60 focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <HiFunnel className="w-4 h-4 text-[#7C706D] shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-[#E7DDD2] rounded-lg text-xs text-[#2B2625] focus:outline-none focus:ring-1 focus:ring-[#C39E96]"
          >
            <option value="all">All Actions ({logs.length})</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#E7DDD2]/60 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E7DDD2]/60 bg-[#FAF6F3]/50 flex items-center justify-between">
          <h3 className="font-serif text-sm font-medium text-[#2B2625]">
            Recorded Events ({filteredLogs.length})
          </h3>
          <span className="text-[10px] font-mono text-[#7C706D]">MongoDB Audit Collection</span>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#C39E96] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#7C706D]">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/80 text-[#7C706D] font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Admin Account</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP & Client</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DDD2]/50">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#FAF6F3]/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#7C706D] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {getActionIcon(log.action)}
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#2B2625] text-xs">
                        {log.adminName || log.adminEmail || 'System'}
                      </div>
                      {log.adminName && log.adminEmail && (
                        <div className="text-[10px] font-mono text-[#7C706D]">{log.adminEmail}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#2B2625]">
                      {log.targetResource || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-[#2B2625] bg-[#FAF6F3] px-1.5 py-0.5 rounded border border-[#E7DDD2]/60">
                        {log.ip || 'Local / Server'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium font-mono text-[11px]">
                          <HiCheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium font-mono text-[11px]">
                          <HiXCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedEntry(log)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white border border-[#E7DDD2] hover:border-[#2B2625] text-[#2B2625] rounded-md transition-all"
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#7C706D]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#1C1817]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-[#E7DDD2] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2B2625]">Event Payload Details</h3>
                <span className="font-mono text-xs text-[#7C706D] uppercase">{selectedEntry.action}</span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-[#7C706D] hover:text-[#2B2625] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E7DDD2]/40">
                <span className="text-[#7C706D] font-medium">Timestamp:</span>
                <span className="font-mono text-[#2B2625]">
                  {new Date(selectedEntry.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E7DDD2]/40">
                <span className="text-[#7C706D] font-medium">Initiator:</span>
                <span className="font-mono text-[#2B2625]">{selectedEntry.adminEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E7DDD2]/40">
                <span className="text-[#7C706D] font-medium">Source IP:</span>
                <span className="font-mono text-[#2B2625]">{selectedEntry.ip}</span>
              </div>
              {selectedEntry.userAgent && (
                <div className="py-1 border-b border-[#E7DDD2]/40">
                  <span className="text-[#7C706D] font-medium block mb-1">User Agent:</span>
                  <p className="font-mono text-[10px] text-[#7C706D] bg-[#FAF6F3] p-2 rounded break-all">
                    {selectedEntry.userAgent}
                  </p>
                </div>
              )}
              {selectedEntry.details && (
                <div className="pt-2">
                  <span className="text-[#7C706D] font-medium block mb-1">Metadata Payload:</span>
                  <pre className="p-3 bg-[#FAF6F3] rounded-lg font-mono text-[11px] text-[#2B2625] overflow-x-auto max-h-48 border border-[#E7DDD2]/60">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7DDD2] flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-[#2B2625] text-white text-xs font-medium rounded-lg hover:bg-[#3D3735]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
