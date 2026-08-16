"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUserPlus, HiTrash, HiPencil } from 'react-icons/hi2';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' });
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const url = '/api/auth/users';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();

    if (res.ok) {
      setMessage(editingId ? 'User updated successfully' : 'User created successfully');
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', email: '', password: '', role: 'editor' });
      fetchUsers();
    } else {
      setMessage(data.error || 'Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch('/api/auth/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage('User deleted');
      fetchUsers();
    }
  };

  const handleEdit = (user: User) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setEditingId(user._id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-rich-black mb-1">Users</h1>
          <p className="font-sans text-sm text-warm-gray/60">Manage admin and editor accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', email: '', password: '', role: 'editor' }); }}
          className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all"
        >
          <HiUserPlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {message && (
        <div className="p-4 bg-magenta/5 border border-magenta/10 text-magenta font-sans text-sm mb-6">
          {message}
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-cream/50 p-6 mb-8"
        >
          <h2 className="font-serif text-xl text-rich-black mb-6">{editingId ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40" required />
            </div>
            <div>
              <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40" required />
            </div>
            <div>
              <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Password {editingId && '(leave blank to keep current)'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black placeholder:text-warm-gray/40 font-sans text-sm transition-all focus:outline-none focus:border-magenta/40" required={!editingId} />
            </div>
            <div>
              <label className="block font-sans text-xs text-warm-gray/60 uppercase tracking-wider mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 bg-white border border-cream/60 text-rich-black font-sans text-sm appearance-none bg-white transition-all focus:outline-none focus:border-magenta/40">
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full max-w-md mx-auto px-8 py-4 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-charcoal transition-all">
                {editingId ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white border border-cream/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cream/50 bg-ivory/50">
                <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Name</th>
                <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Email</th>
                <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Role</th>
                <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Created</th>
                <th className="text-right p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center font-sans text-sm text-warm-gray/40">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center font-sans text-sm text-warm-gray/40">No users yet. Create your first user above.</td></tr>
              ) : (
                users.map((user, i) => (
                  <tr key={user._id} className={`border-b border-cream/30 hover:bg-ivory/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-ivory/20'}`}>
                    <td className="p-4 font-sans text-sm text-rich-black">{user.name}</td>
                    <td className="p-4 font-sans text-sm text-warm-gray/70">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 font-sans text-xs ${user.role === 'admin' ? 'bg-rich-black text-white' : 'bg-cream text-warm-gray'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-sm text-warm-gray/50">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-cream/50 text-warm-gray/60 hover:text-rich-black transition-all">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(user._id)} className="p-2 hover:bg-magenta/5 text-warm-gray/60 hover:text-magenta transition-all">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}