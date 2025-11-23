'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl
    });
    if (res?.error) {
      setError('Invalid credentials');
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="glass-card">
        <h1 className="mb-6 text-3xl font-semibold">Welcome back</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-white/70">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
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
          <button type="submit" className="btn-primary w-full justify-center text-center">
            Sign In
          </button>
        </form>
      </div>
      <p className="text-center text-sm text-white/70">
        New here?{' '}
        <a className="text-accent" href="/auth/register">
          Create an account
        </a>
      </p>
    </div>
  );
}
