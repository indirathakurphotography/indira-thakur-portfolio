'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiKey, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi2';

interface AuthUser {
  email: string;
  role: string;
  name?: string;
  userId?: string;
}

export default function AccountPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/verify');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setName(data.user.name || '');
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg(null);
    setSavingName(true);

    try {
      const usersRes = await fetch('/api/auth/users');
      if (!usersRes.ok) throw new Error('Failed to fetch users');
      const { users } = await usersRes.json();
      const currentUser = users.find((u: { email: string }) => u.email === user?.email);
      if (!currentUser) throw new Error('User not found');

      const res = await fetch('/api/auth/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser._id, name }),
      });

      if (res.ok) {
        setNameMsg({ type: 'success', text: 'Username updated successfully' });
        setUser((prev) => prev ? { ...prev, name } : prev);
      } else {
        const data = await res.json();
        setNameMsg({ type: 'error', text: data.error || 'Failed to update username' });
      }
    } catch {
      setNameMsg({ type: 'error', text: 'Failed to update username' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setSavingPw(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setPwMsg({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-sans text-sm text-warm-gray/40">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-serif text-3xl text-rich-black mb-1">Account Settings</h1>
        <p className="font-sans text-sm text-warm-gray/60">Manage your account credentials</p>
      </motion.div>

      {/* Current Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white border border-cream/50 p-6 mb-6"
      >
        <h2 className="font-serif text-lg text-rich-black mb-4">Account Info</h2>
        <div className="space-y-2">
          <p className="font-sans text-sm text-warm-gray/60">
            <span className="uppercase tracking-wider text-xs">Email</span>
          </p>
          <p className="font-sans text-sm text-rich-black">{user?.email ?? '—'}</p>
          <p className="font-sans text-sm text-warm-gray/60 mt-3">
            <span className="uppercase tracking-wider text-xs">Role</span>
          </p>
          <p>
            <span className="inline-block px-3 py-1 font-sans text-xs bg-rich-black text-white">
              {user?.role ?? '—'}
            </span>
          </p>
        </div>
      </motion.div>

      {/* Update Username */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white border border-cream/50 p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <HiUser className="w-5 h-5 text-magenta" />
          <h2 className="font-serif text-lg text-rich-black">Update Username</h2>
        </div>

        {nameMsg && (
          <div className={`flex items-center gap-2 p-3 mb-4 font-sans text-sm ${nameMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {nameMsg.type === 'success' ? <HiCheckCircle className="w-4 h-4 flex-shrink-0" /> : <HiExclamationCircle className="w-4 h-4 flex-shrink-0" />}
            {nameMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="px-6 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all disabled:opacity-50"
          >
            {savingName ? 'Saving...' : 'Update Username'}
          </button>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white border border-cream/50 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <HiKey className="w-5 h-5 text-magenta" />
          <h2 className="font-serif text-lg text-rich-black">Change Password</h2>
        </div>

        {pwMsg && (
          <div className={`flex items-center gap-2 p-3 mb-4 font-sans text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {pwMsg.type === 'success' ? <HiCheckCircle className="w-4 h-4 flex-shrink-0" /> : <HiExclamationCircle className="w-4 h-4 flex-shrink-0" />}
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              required
            />
          </div>
          <div>
            <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={savingPw}
            className="px-6 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all disabled:opacity-50"
          >
            {savingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
