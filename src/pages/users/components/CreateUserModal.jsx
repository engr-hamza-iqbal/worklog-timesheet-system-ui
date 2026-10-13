import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../../../api/client.js';
import Badge from '../../../components/Badge.jsx';
import { userSchema } from '../../../validation/formSchemas.js';

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-red-400 hover:text-red-600 ml-auto">✕</button>}
    </div>
  );
}

export default function CreateUserForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', accountType: 'EMPLOYEE' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = userSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Correct the user details.'); return; }
    setLoading(true);
    setError('');
    try {
      // POST /api/users → { success, data: { id, name, email, accountType, isActive, createdAt }, message }
      const res = await api.post('/api/users', { ...parsed.data, accountType: 'EMPLOYEE' });
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Full name</label>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Jane Smith" required autoFocus
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Work email</label>
        <input type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
        <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Role</label>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
          <Badge variant="employee" label="Employee" />
          <span className="text-[11px] text-slate-400">Assigned by default</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5">
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Creating...' : 'Create user'}
        </button>
      </div>
    </form>
  );
}
