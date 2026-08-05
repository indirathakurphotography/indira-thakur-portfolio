"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiPhoto, HiCommandLine, HiUserGroup, HiStar, HiQuestionMarkCircle, HiCalendarDays, HiEnvelope, HiUser, HiClock, HiArrowRight, HiChartBar, HiPlus } from 'react-icons/hi2';

interface DashboardStats {
  totalImages: number;
  totalServices: number;
  totalTestimonials: number;
  totalReviews: number;
  totalFAQs: number;
  recentContacts: number;
  pendingBookings: number;
  unreadMessages: number;
}

interface RecentBooking {
  _id: string;
  name: string;
  email: string;
  service: string;
  date: string;
  status: string;
  createdAt: string;
}

interface RecentContact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  read: boolean;
  createdAt: string;
}

interface RecentActivity {
  id: string;
  action: string;
  item: string;
  timestamp: string;
  user: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard');
      if (!statsResponse.ok) throw new Error('Failed to fetch dashboard stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent bookings
      const bookingsResponse = await fetch('/api/bookings');
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.slice(0, 5));
      }

      // Fetch recent contacts
      const contactsResponse = await fetch('/api/contacts');
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setRecentContacts(contactsData.slice(0, 5));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  if (loading) return <div className="flex items-center justify-center h-64">Loading dashboard...</div>;
  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>;

  const statCards = [
    {
      label: 'Gallery Images',
      value: stats?.totalImages || 0,
      icon: HiPhoto,
      color: 'bg-indigo-100 text-indigo-600',
      iconColor: 'text-indigo-600',
      link: '/admin/gallery',
    },
    {
      label: 'Services',
      value: stats?.totalServices || 0,
      icon: HiCommandLine,
      color: 'bg-green-100 text-green-600',
      iconColor: 'text-green-600',
      link: '/admin/services',
    },
    {
      label: 'Testimonials',
      value: stats?.totalTestimonials || 0,
      icon: HiUserGroup,
      color: 'bg-yellow-100 text-yellow-600',
      iconColor: 'text-yellow-600',
      link: '/admin/testimonials',
    },
    {
      label: 'Reviews',
      value: stats?.totalReviews || 0,
      icon: HiStar,
      color: 'bg-blue-100 text-blue-600',
      iconColor: 'text-blue-600',
      link: '/admin/reviews',
    },
    {
      label: 'FAQs',
      value: stats?.totalFAQs || 0,
      icon: HiQuestionMarkCircle,
      color: 'bg-purple-100 text-purple-600',
      iconColor: 'text-purple-600',
      link: '/admin/faq',
    },
    {
      label: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: HiCalendarDays,
      color: 'bg-orange-100 text-orange-600',
      iconColor: 'text-orange-600',
      link: '/admin/bookings',
    },
    {
      label: 'Unread Messages',
      value: stats?.unreadMessages || 0,
      icon: HiEnvelope,
      color: 'bg-magenta-100 text-magenta-600',
      iconColor: 'text-magenta-600',
      link: '/admin/contact',
    },
    {
      label: 'Recent Contacts',
      value: stats?.recentContacts || 0,
      icon: HiUser,
      color: 'bg-pink-100 text-pink-600',
      iconColor: 'text-pink-600',
      link: '/admin/contact',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="font-serif text-2xl md:text-3xl text-rich-black mb-2">Dashboard Overview</h2>
        <p className="font-sans text-sm text-warm-gray/60">Welcome back! Here's an overview of your portfolio.</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className={`bg-white rounded-lg shadow-sm border border-cream/50 p-6 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => window.location.href = stat.link}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = stat.link; }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`p-3 rounded-full ${stat.color} mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} aria-hidden="true" />
                </div>
                <h3 className="font-sans text-sm text-warm-gray/60 uppercase tracking-wider mb-1">{stat.label}</h3>
                <p className="font-serif text-3xl font-bold text-rich-black">{stat.value}</p>
              </div>
              <HiArrowRight className="w-5 h-5 text-warm-gray/40 mt-2" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto">
        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-cream/50 overflow-hidden flex flex-col"
        >
          <div className="p-4 md:p-6 border-b border-cream/50 flex items-center justify-between">
            <h3 className="font-serif text-lg md:text-xl text-rich-black">Recent Bookings</h3>
            <a
              href="/admin/bookings"
              className="hidden md:flex items-center gap-1 font-sans text-xs tracking-wider uppercase text-magenta hover:text-raspberry transition-colors"
            >
              <HiArrowRight className="w-4 h-4" />
              View All
            </a>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center">
                <HiCalendarDays className="w-12 h-12 mx-auto text-warm-gray/30 mb-3" />
                <p className="font-sans text-sm text-warm-gray/50">No bookings yet</p>
              </div>
            ) : (
              <div className="divide-y divide-cream/50">
                {recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 md:p-6 hover:bg-ivory/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm md:text-base text-rich-black truncate">{booking.name}</p>
                        <p className="font-sans text-xs md:text-sm text-warm-gray/50 mt-1">{booking.service}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className={`font-sans text-xs px-2.5 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className="font-sans text-xs text-warm-gray/40 whitespace-nowrap">
                          {formatDate(booking.date)}
                        </span>
                        <a
                          href={`/admin/bookings?id=${booking._id}`}
                          className="font-sans text-xs text-magenta hover:text-raspberry flex items-center gap-1"
                        >
                          <HiArrowRight className="w-3 h-3" />
                          View
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-white rounded-lg shadow-sm border border-cream/50 overflow-hidden flex flex-col"
        >
          <div className="p-4 md:p-6 border-b border-cream/50 flex items-center justify-between">
            <h3 className="font-serif text-lg md:text-xl text-rich-black">Recent Messages</h3>
            <a
              href="/admin/contact"
              className="hidden md:flex items-center gap-1 font-sans text-xs tracking-wider uppercase text-magenta hover:text-raspberry transition-colors"
            >
              <HiArrowRight className="w-4 h-4" />
              View All
            </a>
          </div>
          <div className="flex-1 overflow-y-auto">
            {recentContacts.length === 0 ? (
              <div className="p-8 text-center">
                <HiEnvelope className="w-12 h-12 mx-auto text-warm-gray/30 mb-3" />
                <p className="font-sans text-sm text-warm-gray/50">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-cream/50">
                {recentContacts.map((contact, index) => (
                  <motion.div
                    key={contact._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 md:p-6 hover:bg-ivory/50 transition-colors ${!contact.read ? 'bg-magenta/5' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!contact.read && (
                            <span className="w-2 h-2 rounded-full bg-magenta/60 flex-shrink-0" />
                          )}
                          <p className="font-serif text-sm md:text-base text-rich-black truncate">{contact.name}</p>
                        </div>
                        <p className="font-sans text-xs md:text-sm text-warm-gray/50 truncate">{contact.email}</p>
                        <p className="font-sans text-xs md:text-sm text-warm-gray/60 mt-1 line-clamp-2">{contact.subject}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-sans text-xs text-warm-gray/40 whitespace-nowrap">
                          {formatDate(contact.createdAt)}
                        </span>
                        <a
                          href={`/admin/contact?id=${contact._id}`}
                          className="font-sans text-xs text-magenta hover:text-raspberry flex items-center gap-1"
                        >
                          <HiArrowRight className="w-3 h-3" />
                          View
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-cream/50 p-4 md:p-6 flex flex-col"
        >
          <h3 className="font-serif text-lg md:text-xl text-rich-black mb-4 md:mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            <a
              href="/admin/services"
              onClick={(e) => { e.preventDefault(); window.location.href = '/admin/services'; }}
              className="p-4 md:p-5 border border-cream/50 rounded-lg hover:bg-ivory/50 hover:border-magenta/30 transition-all group"
            >
              <div className="text-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mx-auto mb-3 md:mb-4 group-hover:bg-indigo-200 transition-colors">
                  <HiPlus className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <span className="font-sans text-sm md:text-base font-medium text-rich-black">Add Service</span>
              </div>
            </a>
            <a
              href="/admin/testimonials"
              onClick={(e) => { e.preventDefault(); window.location.href = '/admin/testimonials'; }}
              className="p-4 md:p-5 border border-cream/50 rounded-lg hover:bg-ivory/50 hover:border-magenta/30 transition-all group"
            >
              <div className="text-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mx-auto mb-3 md:mb-4 group-hover:bg-green-200 transition-colors">
                  <HiUserGroup className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <span className="font-sans text-sm md:text-base font-medium text-rich-black">Add Testimonial</span>
              </div>
            </a>
            <a
              href="/admin/faq"
              onClick={(e) => { e.preventDefault(); window.location.href = '/admin/faq'; }}
              className="p-4 md:p-5 border border-cream/50 rounded-lg hover:bg-ivory/50 hover:border-magenta/30 transition-all group"
            >
              <div className="text-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mx-auto mb-3 md:mb-4 group-hover:bg-purple-200 transition-colors">
                  <HiQuestionMarkCircle className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <span className="font-sans text-sm md:text-base font-medium text-rich-black">Add FAQ</span>
              </div>
            </a>
            <a
              href="/admin/gallery"
              onClick={(e) => { e.preventDefault(); window.location.href = '/admin/gallery'; }}
              className="p-4 md:p-5 border border-cream/50 rounded-lg hover:bg-ivory/50 hover:border-magenta/30 transition-all group"
            >
              <div className="text-center">
                <div className="p-3 rounded-full bg-pink-100 text-pink-600 mx-auto mb-3 md:mb-4 group-hover:bg-pink-200 transition-colors">
                  <HiPhoto className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <span className="font-sans text-sm md:text-base font-medium text-rich-black">Upload Image</span>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-white rounded-lg shadow-sm border border-cream/50 p-4 md:p-6 flex flex-col"
        >
          <h3 className="font-serif text-lg md:text-xl text-rich-black mb-4 md:mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4">
            {recentBookings.slice(0, 3).map((booking, index) => (
              <motion.div
                key={`booking-${booking._id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-2.5 md:mt-3" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-rich-black">New booking: <span className="font-medium">{booking.name}</span> - {booking.service}</p>
                  <p className="font-sans text-xs text-warm-gray/50">{formatDate(booking.createdAt)}</p>
                </div>
              </motion.div>
            ))}
            {recentContacts.slice(0, 3).map((contact, index) => (
              <motion.div
                key={`contact-${contact._id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (index + 3) * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-2 h-2 bg-magenta-600 rounded-full mt-2.5 md:mt-3" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-rich-black">New message from <span className="font-medium">{contact.name}</span></p>
                  <p className="font-sans text-xs text-warm-gray/50">{formatDate(contact.createdAt)}</p>
                </div>
              </motion.div>
            ))}
            {(recentBookings.length === 0 && recentContacts.length === 0) && (
              <div className="text-center py-8 text-warm-gray/50">
                <HiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-sans text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}