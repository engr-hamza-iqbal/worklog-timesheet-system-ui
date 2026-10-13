import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../../../api/client.js';
import { clientSchema } from '../../../validation/formSchemas.js';

function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  );
}

export default function ClientForm({ client, onSuccess, onCancel }) {
  const [name, setName] = useState(client?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = clientSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Enter a client name.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (client) {
        const res = await api.put(`/api/clients/${client.id}`, parsed.data);
        onSuccess(res.data);
      } else {
        const res = await api.post('/api/clients', parsed.data);
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to save client.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Client name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Acme Corp"
          required
          autoFocus
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-medium rounded transition cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
        >
          {loading && <Loader2 className="animate-spin" size={13} />}
          {loading ? 'Saving...' : client ? 'Save changes' : 'Create client'}
        </button>
      </div>
    </form>
  );
}
