export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E7DDD2]/60">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#E7DDD2]/70 rounded-md" />
          <div className="h-4 w-72 bg-[#E7DDD2]/40 rounded-md" />
        </div>
        <div className="h-9 w-32 bg-[#E7DDD2]/50 rounded-md" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-[#E7DDD2]/60 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="h-4 w-24 bg-[#E7DDD2]/50 rounded-sm" />
            <div className="h-8 w-16 bg-[#C39E96]/30 rounded-sm" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="bg-white border border-[#E7DDD2]/60 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="h-6 w-56 bg-[#E7DDD2]/60 rounded-md" />
        <div className="space-y-3 pt-2">
          <div className="h-12 w-full bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/40" />
          <div className="h-12 w-full bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/40" />
          <div className="h-12 w-full bg-[#FAF6F3] rounded-lg border border-[#E7DDD2]/40" />
        </div>
      </div>
    </div>
  );
}
