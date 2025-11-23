'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Invalid password' }));
      setError(data.error || 'Invalid password');
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="glass-card space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Secure access</p>
          <h1 className="text-3xl font-semibold text-white">Enter passphrase</h1>
          <p className="text-sm text-white/70">This notebook is private. Provide your password to unlock it.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-white/70">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center text-center" disabled={loading}>
            {loading ? 'Verifying…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
