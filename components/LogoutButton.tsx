'use client';

export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
    >
      Logout
    </button>
  );
}
