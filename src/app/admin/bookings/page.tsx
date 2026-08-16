"use client";

import { useState, useEffect } from 'react';
import { HiTrash, HiPencil, HiEye, HiCalendarDays, HiEnvelope, HiPhone, HiXMark, HiArrowRight, HiExclamationCircle } from 'react-icons/hi2';
import { toast } from '@/lib/toast';

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  message: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [previewBooking, setPreviewBooking] = useState<Booking | null>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null }>({ id: null });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (id: string, status: Booking['status']) => {
    setSaving(id);
    try {
      const response = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await fetchBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteBookingId(id);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteBookingId;
    if (!id) return;
    setDeleteBookingId(null);
    try {
      const response = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete booking');
      await fetchBookings();
      toast.success('Booking deleted successfully');
    } catch (err) {
      toast.error('Failed to delete booking');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'completed': return 'bg-blue-50 text-blue-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading bookings...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-serif text-3xl md:text-4xl text-rich-black mb-2">Bookings</h1>
        <p className="font-sans text-sm text-warm-gray/60">Manage session bookings and inquiries</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <HiCalendarDays className="w-16 h-16 text-warm-gray/30 mb-4" />
            <p className="font-serif text-xl text-warm-gray/60">No bookings yet</p>
            <p className="font-sans text-sm text-warm-gray/40 mt-1">Bookings will appear here when clients submit them</p>
          </div>
        ) : (
          <div className="bg-white border border-cream/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream/50 bg-ivory/50">
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Client</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Contact</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Service</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Date</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Status</th>
                    <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Created</th>
                    <th className="text-right p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className={`border-b border-cream/30 hover:bg-ivory/50 transition-colors ${booking.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                            <span className="font-serif text-sm text-rich-black">
                              {booking.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-serif text-sm text-rich-black">{booking.name}</p>
                            <p className="font-sans text-xs text-warm-gray/50">{booking.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {booking.phone && (
                            <span className="flex items-center gap-1 font-sans text-xs text-warm-gray/60">
                              <HiPhone className="w-3 h-3" />
                              {booking.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70">{booking.service}</td>
                      <td className="p-4 font-sans text-sm text-warm-gray/70 whitespace-nowrap">{formatDate(booking.date)}</td>
                      <td className="p-4">
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking._id, e.target.value as Booking['status'])}
                          disabled={saving === booking._id}
                          className={`font-sans text-xs px-3 py-1.5 rounded-full ${getStatusColor(booking.status)} ${saving === booking._id ? 'opacity-50 cursor-wait' : ''}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 font-sans text-xs text-warm-gray/50">{formatDate(booking.createdAt)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewBooking(booking)}
                            className="p-2 hover:bg-cream rounded-lg text-warm-gray/60 hover:text-rich-black transition-all"
                            aria-label="View details"
                          >
                            <HiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(booking._id)}
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
      {previewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewBooking(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-cream">
              <h3 className="font-serif text-lg text-rich-black">Booking Details: {previewBooking.name}</h3>
              <button onClick={() => setPreviewBooking(null)} className="p-2 hover:bg-cream rounded-lg">
                <HiXMark className="w-5 h-5 text-rich-black" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Name</p>
                  <p className="font-serif text-sm text-rich-black">{previewBooking.name}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Email</p>
                  <p className="font-sans text-sm text-rich-black">{previewBooking.email}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Phone</p>
                  <p className="font-sans text-sm text-rich-black">{previewBooking.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Service</p>
                  <p className="font-sans text-sm text-rich-black">{previewBooking.service}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Session Date</p>
                  <p className="font-sans text-sm text-rich-black">{formatDate(previewBooking.date)}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Status</p>
                  <span className={`inline-block px-3 py-1 font-sans text-xs rounded-full ${getStatusColor(previewBooking.status)}`}>
                    {previewBooking.status}
                  </span>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Submitted</p>
                  <p className="font-sans text-sm text-rich-black">{formatDate(previewBooking.createdAt)}</p>
                </div>
                <div>
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60">Last Updated</p>
                  <p className="font-sans text-sm text-rich-black">{formatDate(previewBooking.updatedAt)}</p>
                </div>
              </div>
              {previewBooking.message && (
                <div className="pt-4 border-t border-cream">
                  <p className="font-sans text-xs tracking-wider uppercase text-warm-gray/60 mb-2">Message</p>
                  <p className="font-sans text-sm text-warm-gray/70 whitespace-pre-wrap">{previewBooking.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-rich-black/80 backdrop-blur-sm p-4" onClick={() => setDeleteBookingId(null)}>
          <div className="bg-white rounded-lg max-w-md w-full flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-cream">
              <h3 className="font-serif text-lg text-rich-black">Delete Booking</h3>
              <button onClick={() => setDeleteBookingId(null)} className="p-2 hover:bg-cream rounded-lg">
                <HiXMark className="w-5 h-5 text-rich-black" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <HiExclamationCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
                <p className="font-sans text-sm text-rich-black">Are you sure you want to delete this booking? This action cannot be undone.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteBookingId(null)}
                  className="px-4 py-2 font-sans text-sm border border-cream/60 text-warm-gray/60 hover:bg-cream/50 transition-all rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 font-sans text-sm bg-magenta text-white rounded hover:bg-raspberry transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}