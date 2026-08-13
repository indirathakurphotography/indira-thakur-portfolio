'use client';

import { useState, useEffect } from 'react';
import { HiCommandLine, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi2';

export default function AdminHealthPage() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    async function checkHealth() {
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch('/api/health', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          setDbStatus('connected');
        } else {
          setDbStatus('disconnected');
        }
      } catch {
        setDbStatus('disconnected');
      } finally {
        setLastCheck(new Date().toLocaleTimeString());
      }
    }
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] flex items-center gap-2">
          <HiCommandLine className="w-7 h-7 text-[#C39E96]" />
          System Health & Status
        </h1>
        <p className="font-sans text-sm text-[#7C706D] mt-1">
          Monitor system services, database connectivity, and environment status.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[#E7DDD2] shadow-2xs space-y-4">
        <h2 className="font-serif text-lg font-medium text-[#2B2625] border-b border-[#E7DDD2] pb-2">
          Services Status
        </h2>

        <div className="flex items-center justify-between p-4 border border-[#E7DDD2] rounded-lg bg-[#FAF6F3]">
          <div className="space-y-1">
            <h3 className="font-medium text-[#2B2625] text-sm">Database Connectivity</h3>
            <p className="text-xs text-[#7C706D]">MongoDB storage engine</p>
          </div>
          <div className="flex items-center gap-2">
            {dbStatus === 'checking' && (
              <span className="text-xs text-[#7C706D]">Checking...</span>
            )}
            {dbStatus === 'connected' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Operational
              </span>
            )}
            {dbStatus === 'disconnected' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <HiExclamationCircle className="w-4 h-4 text-amber-600" /> Unavailable
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-[#E7DDD2] rounded-lg bg-[#FAF6F3]">
          <div className="space-y-1">
            <h3 className="font-medium text-[#2B2625] text-sm">Next.js Web Server</h3>
            <p className="text-xs text-[#7C706D]">App router runtime</p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Active
          </span>
        </div>

        {lastCheck && (
          <p className="text-xs text-[#7C706D] pt-2">
            Last checked at: {lastCheck}
          </p>
        )}
      </div>
    </div>
  );
}
