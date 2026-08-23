'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ServiceItemData } from '@/lib/servicesStorage';

export interface UseServicesResult {
  services: ServiceItemData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  serviceTitles: string[];
  serviceOptions: { value: string; label: string; slug: string }[];
  featuredServices: ServiceItemData[];
  refetch: () => Promise<void>;
  getServiceBySlug: (slug: string) => ServiceItemData | undefined;
}

export function useServices(): UseServicesResult {
  const [services, setServices] = useState<ServiceItemData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const res = await fetch('/api/services', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch services: ${res.statusText}`);
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      console.warn('useServices hook warning:', err);
      setIsError(true);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const serviceTitles = services.map((s) => s.title).filter(Boolean);

  const serviceOptions = services.map((s) => ({
    value: s.title,
    label: s.title,
    slug: s.slug || s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));

  const featuredServices = services.filter((s) => s.featured);

  const getServiceBySlug = useCallback(
    (slug: string) => {
      const clean = (slug || '').toLowerCase().trim();
      return services.find(
        (s) =>
          (s.slug || '').toLowerCase().trim() === clean ||
          (s.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean
      );
    },
    [services]
  );

  return {
    services,
    isLoading,
    isError,
    error,
    serviceTitles,
    serviceOptions,
    featuredServices,
    refetch: fetchServices,
    getServiceBySlug,
  };
}
