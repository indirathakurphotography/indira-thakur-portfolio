'use client';

import { useEffect, useState } from 'react';

const categories = ['home', 'newborn', 'maternity', 'portrait', 'wedding', 'events', 'brand'];

type Item = {
  _id: string;
  title: string;
  category: string;
  mediaType: 'instagram' | 'video';
  url: string;
  thumbnailUrl?: string;
};

function getAdminHeaders(json = true) {
  const token = localStorage.getItem('admin_token');
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function isInstagramUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase() === 'instagram.com';
  } catch {
    return false;
  }
}

export default function InstagramLinksAdmin() {
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', category: 'home', mediaType: 'instagram' as 'instagram' | 'video', url: '', thumbnailUrl: '' });

  const load = () => fetch('/api/instagram-links').then((response) => response.json()).then((data) => setItems(Array.isArray(data) ? data : []));
  useEffect(() => { void load(); }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.mediaType === 'instagram' && !isInstagramUrl(form.url)) {
      setError('Please enter a full Instagram post or Reel URL from instagram.com.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/instagram-links', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this item.');
      setForm({ title: '', category: 'home', mediaType: 'instagram', url: '', thumbnailUrl: '' });
      await load();
    } catch (saveError: any) {
      setError(saveError?.message || 'Could not save this item.');
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File) => {
    setError(null);
    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'instagram');
    const response = await fetch('/api/upload', { method: 'POST', headers: getAdminHeaders(false), body: data });
    const result = await response.json();
    const uploadedUrl = result.url || result.src;
    if (!response.ok || !uploadedUrl) {
      setError(result.error || 'Video upload failed.');
      return;
    }
    setForm((current) => ({ ...current, url: uploadedUrl, mediaType: 'video' }));
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <h1 className="font-serif text-3xl text-[#2B2625]">Instagram Links</h1>
      <p className="text-sm text-[#7C706D] mt-2">Add public Instagram post or Reel URLs, or upload direct videos, for the homepage and Gallery categories.</p>
      <form onSubmit={save} className="mt-8 grid gap-4 bg-white border border-[#E7DDD2] p-6">
        {error && <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title (optional)" className="border p-3" />
        <div className="grid grid-cols-2 gap-4">
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="border p-3">{categories.map((category) => <option key={category}>{category}</option>)}</select>
          <select value={form.mediaType} onChange={(event) => setForm({ ...form, mediaType: event.target.value as 'instagram' | 'video' })} className="border p-3"><option value="instagram">Instagram URL</option><option value="video">Direct video</option></select>
        </div>
        <input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="Public Instagram post/Reel URL or uploaded video URL" className="border p-3" required />
        {form.mediaType === 'video' && <input type="file" accept="video/*" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} />}
        <input value={form.thumbnailUrl} onChange={(event) => setForm({ ...form, thumbnailUrl: event.target.value })} placeholder="Video thumbnail URL (optional)" className="border p-3" />
        <button disabled={saving} className="bg-[#2B2625] text-white px-5 py-3 disabled:opacity-60">{saving ? 'Saving…' : 'Add Instagram item'}</button>
      </form>
      <div className="mt-10 space-y-3">{items.map((item) => <div key={item._id} className="border border-[#E7DDD2] p-4 flex justify-between gap-4"><div><b>{item.title || 'Untitled'}</b><p className="text-xs text-[#7C706D]">{item.category} · {item.mediaType} · {item.url}</p></div><button onClick={async () => { await fetch(`/api/instagram-links?id=${item._id}`, { method: 'DELETE', headers: getAdminHeaders(false) }); void load(); }} className="text-red-600">Delete</button></div>)}</div>
    </div>
  );
}
