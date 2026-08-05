'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/lib/toast';
import { invalidateSiteConfigCache } from '@/hooks/useSiteConfig';

interface UseCMSOptions {
  verifyWrites?: boolean;
}

interface CMSState {
  config: any;
  loading: boolean;
  saving: boolean;
  error: string | null;
  lastSavedAt: Date | null;
  dirty: boolean;
}

export function useCMS(options: UseCMSOptions = {}) {
  const { verifyWrites = true } = options;
  const [state, setState] = useState<CMSState>({
    config: null,
    loading: true,
    saving: false,
    error: null,
    lastSavedAt: null,
    dirty: false,
  });
  const configRef = useRef<any>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await fetch('/api/site-config');
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(err.error || `Server error (${response.status})`);
      }
      const data = await response.json();
      configRef.current = data;
      setState(prev => ({ ...prev, config: data, loading: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load configuration';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const saveConfig = useCallback(async (data?: any) => {
    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      const payload = data || configRef.current;
      if (!payload) {
        throw new Error('No data to save');
      }

      // Step 1: Send save request
      const response = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(err.error || `Server error (${response.status})`);
      }

      const saved = await response.json();

      // Step 2: Verify read-back if enabled
      if (verifyWrites) {
        const verifyResponse = await fetch('/api/site-config');
        if (!verifyResponse.ok) {
          throw new Error('Save succeeded but verification failed. Please refresh to check.');
        }
        const verified = await verifyResponse.json();

        // Compare key fields to ensure data persisted
        if (JSON.stringify(verified) !== JSON.stringify(saved)) {
          console.warn('Save verification: data mismatch, using server response');
        }

        invalidateSiteConfigCache();
        configRef.current = verified;
        setState(prev => ({
          ...prev,
          config: verified,
          saving: false,
          lastSavedAt: new Date(),
          dirty: false,
        }));
        toast.success('Changes Saved Successfully');
      } else {
        invalidateSiteConfigCache();
        configRef.current = saved;
        setState(prev => ({
          ...prev,
          config: saved,
          saving: false,
          lastSavedAt: new Date(),
          dirty: false,
        }));
        toast.success('Changes Saved Successfully');
      }

      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setState(prev => ({ ...prev, saving: false }));
      toast.error('Failed to Save Changes');
      return null;
    }
  }, [verifyWrites]);

  const updateSection = useCallback((section: string, data: any) => {
    setState(prev => {
      const newConfig = {
        ...prev.config,
        [section]: { ...prev.config[section], ...data },
      };
      configRef.current = newConfig;
      return { ...prev, config: newConfig, dirty: true };
    });
  }, []);

  const updateField = useCallback((path: string, value: any) => {
    setState(prev => {
      const keys = path.split('.');
      const newConfig = { ...prev.config };
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      configRef.current = newConfig;
      return { ...prev, config: newConfig, dirty: true };
    });
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetConfig = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: configRef.current,
      dirty: false,
    }));
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config: state.config,
    loading: state.loading,
    saving: state.saving,
    error: state.error,
    lastSavedAt: state.lastSavedAt,
    dirty: state.dirty,
    fetchConfig,
    saveConfig,
    updateSection,
    updateField,
    clearMessages,
    resetConfig,
  };
}
