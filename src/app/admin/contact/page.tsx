"use client";

import { useState, useEffect } from 'react';
import { HiTrash, HiEye, HiEnvelope, HiXMark, HiCheck, HiArrowRight } from 'react-icons/hi2';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (id: string, read: boolean) => {
    setUpdating(id);
    try {
      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read }),
      });
      if (!response.ok) throw new Error('Failed to update message');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const response = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete message');
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'unread') return !msg.read;
    if (filter === 'read') return msg.read;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64">Loading messages...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-rich-black mb-2">Contact Messages</h1>
          <p className="font-sans text-sm text-warm-gray/60">View and manage contact form submissions</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
                filter === f
                  ? 'bg-rich-black text-white'
                  : 'bg-cream text-warm-gray hover:bg-beige'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} 
              <span className="ml-1 text-xs opacity-75">
                ({f === 'all' ? messages.length : messages.filter(m => f === 'unread' ? !m.read : m.read).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiEnvelope className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">
              {filter === 'unread' ? 'No unread messages' : filter === 'read' ? 'No read messages' : 'No messages yet'}
            </p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">
              {filter === 'all' ? 'Messages will appear here when visitors submit the contact form' : 'Try another filter'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-cream/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream/50 bg-ivory/50">
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Status</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Name</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Email</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Subject</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Date</th>
                    <th className="text-right p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr
                      key={msg._id}
                      className={`border-b border-cream/30 hover:bg-ivory/50 transition-colors ${!msg.read ? 'bg-magenta/5' : ''}`}
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 font-sans text-xs rounded-full ${
                          msg.read ? 'bg-cream/50 text-warm-gray/60' : 'bg-magenta/10 text-magenta/60'
                        }`}>
                          {!msg.read && <span className="w-1.5 h-1.5 rounded-full bg-magenta/60" />}
                          {msg.read ? 'Read' : 'New'}
                        </span>
                      </td>
                      <td className="p-4 font-serif text-sm text-rich-black">{msg.name}</td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70">{msg.email}</td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70 max-w-xs truncate">{msg.subject}</td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70 whitespace-nowrap">{formatDate(msg.createdAt)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewMessage(msg)}
                            className="p-2 hover:bg-cream rounded-lg text-warm-gray/60 hover:text-rich-black transition-all"
                            aria-label="View message"
                          >
                            <HiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMarkRead(msg._id, !msg.read)}
                            disabled={updating === msg._id}
                            className={`p-2 rounded-lg transition-all ${
                              msg.read
                                ? 'text-warm-gray/40 hover:bg-cream hover:text-warm-gray/60'
                                : 'text-magenta/60 hover:bg-magenta/10'
                            } ${updating === msg._id ? 'opacity-50 cursor-wait' : ''}`}
                            aria-label={msg.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {msg.read ? <HiArrowRight className="w-4 h-4" /> : <HiCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(msg._id)}
                            className="p-2 hover:bg-magenta/5 rounded-lg text-warm-gray/60 hover:text-magenta transition-all"
                            aria-label="Delete"
                          >
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewMessage(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-cream">
              <div className="flex items-center gap-3">
                <h3 className="font-serif text-lg text-rich-black">{previewMessage.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-sans text-[10px] rounded-full ${
                  previewMessage.read ? 'bg-cream text-warm-gray/60' : 'bg-magenta/10 text-magenta/60'
                }`}>
                  {!previewMessage.read && <span className="w-1 h-1 rounded-full bg-magenta/60" />}
                  {previewMessage.read ? 'Read' : 'New'}
                </span>
              </div>
              <button onClick={() => setPreviewMessage(null)} className="p-2 hover:bg-cream rounded-lg">
                <HiXMark className="w-5 h-5 text-rich-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Email</p>
                  <p className="font-sans text-sm text-rich-black">{previewMessage.email}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Phone</p>
                  <p className="font-sans text-sm text-rich-black">{previewMessage.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Subject</p>
                  <p className="font-sans text-sm text-rich-black">{previewMessage.subject}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Received</p>
                  <p className="font-sans text-sm text-rich-black">{formatDate(previewMessage.createdAt)}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-cream">
                <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">Message</p>
                <div className="bg-ivory/50 p-4 rounded-lg whitespace-pre-wrap font-sans text-sm text-warm-gray/70">
                  {previewMessage.message}
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-cream">
                <button
                  onClick={() => handleMarkRead(previewMessage._id, !previewMessage.read)}
                  disabled={updating === previewMessage._id}
                  className="px-4 py-2 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all disabled:opacity-50"
                >
                  {updating === previewMessage._id ? 'Updating...' : previewMessage.read ? 'Mark as Unread' : 'Mark as Read'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}