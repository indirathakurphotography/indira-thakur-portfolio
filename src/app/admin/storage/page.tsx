'use client';

import { useState, useEffect } from 'react';
import {
  HiCloudArrowUp,
  HiCheckCircle,
  HiExclamationCircle,
  HiArrowPath,
  HiFolder,
  HiInformationCircle,
  HiShieldCheck,
  HiPlay,
  HiPhoto,
  HiArrowTopRightOnSquare,
} from 'react-icons/hi2';

interface MigrationAsset {
  key: string;
  sourceUrl: string;
  folder: string;
  status: 'PENDING' | 'MIGRATED' | 'BLOCKED_402' | 'FAILED' | 'ALREADY_EXISTS';
  reason?: string;
  r2Url?: string;
  bytes?: number;
}

interface FreeTierInfo {
  storageLimitGB: number;
  storageLimitMB: number;
  storageUsedBytes: number;
  storageUsedMB: number;
  storageUsedGB: number;
  storageRemainingBytes: number;
  storageRemainingMB: number;
  storageRemainingGB: number;
  storagePercentageUsed: number;
  classALimit: number;
  classBLimit: number;
  egressFee: string;
  status: string;
}

interface MigrationData {
  r2Configured: boolean;
  r2Bucket: string;
  r2Endpoint: string;
  r2PublicDomain: string;
  r2TotalObjects?: number;
  r2TotalSizeMB?: number;
  r2FolderBreakdown?: Record<string, number>;
  totalKnownAssets: number;
  freeTier?: FreeTierInfo;
  assets: MigrationAsset[];
}

export default function AdminStoragePage() {
  const [data, setData] = useState<MigrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('/api/migrate-r2', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load storage status: ${res.statusText}`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error fetching storage details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartMigration = async (action: 'migrate' | 'test' | 'seed_all' = 'seed_all') => {
    try {
      setMigrating(true);
      setError(null);
      setMigrationResult(null);

      const token = localStorage.getItem('admin_token') || '';
      const res = await fetch('/api/migrate-r2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Migration failed');
      }

      setMigrationResult(json);
      // Refresh status list
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Migration execution failed');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-medium text-[#2B2625] flex items-center gap-2.5">
          <HiCloudArrowUp className="w-8 h-8 text-[#C39E96]" />
          Cloudflare R2 Storage & Migration
        </h1>
        <p className="font-sans text-xs md:text-sm text-[#7C706D] mt-1">
          Monitor your Cloudflare R2 object storage migration, asset delivery pipeline, and Supabase legacy transfer status.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2.5">
          <HiExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cloudflare R2 Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  data?.r2Configured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <h2 className="font-serif text-lg font-medium text-[#2B2625]">Cloudflare R2 Storage</h2>
            </div>
            {data?.r2Configured ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" /> Active & Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <HiInformationCircle className="w-4 h-4 text-amber-600" /> Credentials Pending
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
              <span className="text-[#7C706D]">Target Bucket:</span>
              <span className="font-mono font-medium text-[#2B2625]">{data?.r2Bucket || 'indira-thakur-media'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
              <span className="text-[#7C706D]">Live R2 Objects:</span>
              <span className="font-mono font-semibold text-emerald-700">
                {data?.r2TotalObjects !== undefined ? `${data.r2TotalObjects} Objects` : '0 Objects'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
              <span className="text-[#7C706D]">Storage Footprint:</span>
              <span className="font-mono font-medium text-[#2B2625]">
                {data?.r2TotalSizeMB !== undefined ? `${data.r2TotalSizeMB} MB` : '0.00 MB'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#FAF6F3]">
              <span className="text-[#7C706D]">Delivery Pipeline:</span>
              <span className="font-mono font-medium text-[#2B2625] truncate max-w-[240px]">
                R2 Streaming Proxy (/api/media/*)
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#7C706D]">Zero Egress Fees:</span>
              <span className="text-emerald-700 font-semibold">Active (Cloudflare R2)</span>
            </div>
            {data?.r2FolderBreakdown && Object.keys(data.r2FolderBreakdown).length > 0 && (
              <div className="pt-2 border-t border-[#FAF6F3]">
                <span className="text-[#7C706D] block mb-1.5">Folder Distribution:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data.r2FolderBreakdown).map(([fld, count]) => (
                    <span key={fld} className="px-2 py-0.5 rounded bg-[#FAF6F3] border border-[#E7DDD2] text-[10px] font-mono text-[#2B2625]">
                      {fld}: <strong className="text-[#C39E96]">{count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!data?.r2Configured && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800">
                <HiInformationCircle className="w-4 h-4 text-amber-600" />
                Activate Cloudflare R2 Credentials
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Add your Cloudflare R2 API tokens in your hosting dashboard (or Settings &rarr; Environment Secrets):
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

        {/* Supabase Legacy Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E7DDD2] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7DDD2] pb-3">
            <h2 className="font-serif text-lg font-medium text-[#2B2625]">Supabase Legacy Source</h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              <HiExclamationCircle className="w-4 h-4 text-rose-600" /> Quota Exceeded (HTTP 402)
            </span>
          </div>

          <div className="space-y-2 text-xs text-[#7C706D]">
            <p>
              <strong className="text-[#2B2625]">Reason:</strong> Supabase project egress bandwidth quota reached (<code className="font-mono text-[11px]">exceed_cached_egress_quota</code>).
            </p>
            <p>
              <strong className="text-[#2B2625]">Safety Guarantee:</strong> Your files in Supabase remain completely safe. Nothing is deleted or modified.
            </p>
            <p>
              <strong className="text-[#2B2625]">Website Continuity:</strong> The application automatically routes media through Cloudflare R2 and high-res fallbacks, ensuring zero broken images on your public site.
            </p>
          </div>

          <div className="p-3 bg-[#FAF6F3] rounded-xl border border-[#E7DDD2] text-xs text-[#2B2625] flex items-center justify-between">
            <span className="font-medium">Total Known Assets to Transfer:</span>
            <span className="font-mono font-bold text-sm text-[#C39E96]">{data?.totalKnownAssets || 27}</span>
          </div>
        </div>
      </div>

      {/* CLOUDFLARE R2 FREE TIER USAGE & QUOTA PROGRESS */}
      {(() => {
        const usedMB = data?.freeTier?.storageUsedMB ?? data?.r2TotalSizeMB ?? 0;
        const totalMB = data?.freeTier?.storageLimitMB ?? 10240; // 10 GB
        const pctUsed = data?.freeTier?.storagePercentageUsed ?? Number(((usedMB / totalMB) * 100).toFixed(2));
        const remainingGB = data?.freeTier?.storageRemainingGB ?? Number(((totalMB - usedMB) / 1024).toFixed(2));
        const remainingMB = data?.freeTier?.storageRemainingMB ?? Number((totalMB - usedMB).toFixed(2));

        return (
          <div className="bg-white p-6 rounded-2xl border border-[#E7DDD2] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FAF6F3] pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2B2625] flex items-center gap-2">
                  <HiCloudArrowUp className="w-5 h-5 text-[#C39E96]" />
                  Cloudflare R2 Free Tier Storage & Quota
                </h3>
                <p className="text-xs text-[#7C706D] mt-0.5">
                  Cloudflare provides 10 GB of permanent free storage with zero egress bandwidth charges.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                {pctUsed < 80 ? 'Within Free Tier (10 GB Free)' : 'Approaching Tier Limit'}
              </span>
            </div>

            {/* Visual Storage Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#7C706D]">
                  Storage Used: <strong className="text-[#2B2625] font-semibold">{usedMB.toFixed(2)} MB</strong> ({pctUsed}% of 10 GB)
                </span>
                <span className="text-emerald-700 font-semibold">
                  {remainingGB} GB Remaining ({remainingMB.toLocaleString()} MB free)
                </span>
              </div>

              <div className="w-full bg-[#FAF6F3] h-3.5 rounded-full border border-[#E7DDD2] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-[#C39E96]"
                  style={{ width: `${Math.max(pctUsed, 0.8)}%` }}
                  title={`${pctUsed}% used (${usedMB} MB / 10,240 MB)`}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[#7C706D] font-mono pt-0.5">
                <span>0 MB</span>
                <span>2.5 GB</span>
                <span>5.0 GB</span>
                <span>7.5 GB</span>
                <span>10.0 GB (Free Tier Cap)</span>
              </div>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2]">
                <span className="text-[11px] text-[#7C706D] uppercase tracking-wider block">Storage Quota</span>
                <span className="font-mono font-bold text-sm text-[#2B2625] block mt-0.5">10 GB Free</span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
                  {remainingGB} GB unallocated
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2]">
                <span className="text-[11px] text-[#7C706D] uppercase tracking-wider block">Class A Operations</span>
                <span className="font-mono font-bold text-sm text-[#2B2625] block mt-0.5">1,000,000 / mo</span>
                <span className="text-[10px] text-[#7C706D] mt-0.5 block">Uploads, lists, and mutations</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F3] border border-[#E7DDD2]">
                <span className="text-[11px] text-[#7C706D] uppercase tracking-wider block">Class B Operations</span>
                <span className="font-mono font-bold text-sm text-[#2B2625] block mt-0.5">10,000,000 / mo</span>
                <span className="text-[10px] text-[#7C706D] mt-0.5 block">Image reads and metadata checks</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                <span className="text-[11px] text-emerald-800 uppercase tracking-wider block font-semibold">Egress Bandwidth</span>
                <span className="font-mono font-bold text-sm text-emerald-800 block mt-0.5">$0.00 / Always Free</span>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">No egress fees, unlike AWS or Supabase</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Migration Action Bar */}
      <div className="bg-[#FAF6F3] border border-[#E7DDD2] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-serif text-base font-medium text-[#2B2625]">Migrate Assets to Cloudflare R2</h3>
          <p className="text-xs text-[#7C706D]">
            Transfers all accessible images and videos from Supabase Storage into your R2 bucket preserving structure and metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading || migrating}
            className="px-3.5 py-2 text-xs rounded-xl bg-white border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors flex items-center gap-1.5"
          >
            <HiArrowPath className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            type="button"
            onClick={() => handleStartMigration('test')}
            disabled={migrating}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-white border border-[#C39E96] text-[#2B2625] hover:bg-[#FAF6F3] transition-colors flex items-center gap-1.5"
          >
            {migrating ? (
              <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" />
            ) : (
              <HiPlay className="w-3.5 h-3.5 text-[#C39E96]" />
            )}
            Run Diagnostic Probe
          </button>

          <button
            type="button"
            onClick={() => handleStartMigration('seed_all')}
            disabled={loading || migrating || !data?.r2Configured}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 shadow-2xs transition-all ${
              !data?.r2Configured
                ? 'bg-gray-400 cursor-not-allowed opacity-75'
                : migrating
                ? 'bg-[#A89F91] cursor-wait'
                : 'bg-[#2B2625] hover:bg-[#3D3534]'
            }`}
          >
            {migrating ? (
              <>
                <HiArrowPath className="w-3.5 h-3.5 animate-spin text-[#C39E96]" /> Migrating Assets...
              </>
            ) : (
              <>
                <HiCloudArrowUp className="w-4 h-4 text-[#C39E96]" /> Start / Resume R2 Migration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Migration Results Banner if completed */}
      {migrationResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <HiCheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Migration Run Completed</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
            <div className="bg-white/80 p-2 rounded border border-emerald-100">
              <span className="block text-emerald-700 font-bold text-sm">{migrationResult.summary?.migrated}</span>
              <span className="text-[10px] text-[#7C706D]">Migrated</span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-100">
              <span className="block text-amber-700 font-bold text-sm">{migrationResult.summary?.alreadyExists}</span>
              <span className="text-[10px] text-[#7C706D]">Already in R2</span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-100">
              <span className="block text-rose-700 font-bold text-sm">{migrationResult.summary?.blockedBySupabase402}</span>
              <span className="text-[10px] text-[#7C706D]">Blocked (HTTP 402)</span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-emerald-100">
              <span className="block text-[#2B2625] font-bold text-sm">{migrationResult.summary?.total}</span>
              <span className="text-[10px] text-[#7C706D]">Total Audited</span>
            </div>
          </div>
        </div>
      )}

      {/* Asset Audit Table */}
      <div className="bg-white rounded-2xl border border-[#E7DDD2] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E7DDD2] flex items-center justify-between">
          <h3 className="font-serif text-base font-medium text-[#2B2625] flex items-center gap-2">
            <HiFolder className="w-4 h-4 text-[#C39E96]" />
            Audited Media Assets Inventory
          </h3>
          <span className="text-xs text-[#7C706D]">{data?.assets?.length || 0} Assets Cataloged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E7DDD2] bg-[#FAF6F3]/70 text-[#7C706D] font-mono uppercase text-[10px]">
                <th className="p-3 font-medium">Folder & Key</th>
                <th className="p-3 font-medium">Storage Path</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Delivery URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DDD2]/60 font-sans">
              {data?.assets?.map((asset, i) => (
                <tr key={i} className="hover:bg-[#FAF6F3]/40 transition-colors">
                  <td className="p-3">
                    <div className="font-medium text-[#2B2625] flex items-center gap-1.5">
                      <HiPhoto className="w-3.5 h-3.5 text-[#C39E96] shrink-0" />
                      <span className="truncate max-w-[200px]" title={asset.key}>
                        {asset.key.split('/').pop()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#7C706D]">{asset.folder}</span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-[#7C706D] max-w-[240px] truncate" title={asset.key}>
                    {asset.key}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {asset.status === 'ALREADY_EXISTS' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <HiCheckCircle className="w-3.5 h-3.5" /> Present in R2
                      </span>
                    )}
                    {asset.status === 'MIGRATED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <HiCheckCircle className="w-3.5 h-3.5" /> Migrated
                      </span>
                    )}
                    {asset.status === 'BLOCKED_402' && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200"
                        title={asset.reason}
                      >
                        <HiExclamationCircle className="w-3.5 h-3.5" /> Blocked (Supabase 402)
                      </span>
                    )}
                    {asset.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending Transfer
                      </span>
                    )}
                    {asset.status === 'FAILED' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[11px]">
                    {asset.r2Url ? (
                      <a
                        href={asset.r2Url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#C39E96] hover:text-[#2B2625] font-mono inline-flex items-center gap-1 underline underline-offset-2 truncate max-w-[200px]"
                        title={asset.r2Url}
                      >
                        <span>{asset.r2Url}</span>
                        <HiArrowTopRightOnSquare className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-[#7C706D] font-mono text-[10px]">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
