'use client';

import { useState, useEffect } from 'react';
import type { IDynamicSection } from '@/models/DynamicSections';

interface DynamicSectionsResponse {
  pageKey: string;
  sections: IDynamicSection[];
}

export function useDynamicSections(pageKey: string) {
  const [sections, setSections] = useState<IDynamicSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSections = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/dynamic-sections?pageKey=${encodeURIComponent(pageKey)}`);
        if (!res.ok) throw new Error(`Failed to fetch sections (${res.status})`);
        const data: DynamicSectionsResponse = await res.json();
        if (!cancelled) {
          const sorted = (data.sections || [])
            .filter((s) => s.visible)
            .sort((a, b) => a.order - b.order);
          setSections(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSections();
    return () => { cancelled = true; };
  }, [pageKey]);

  return { sections, loading, error };
}
