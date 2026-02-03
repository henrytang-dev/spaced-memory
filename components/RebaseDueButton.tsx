'use client';

import { useState } from 'react';

export default function RebaseDueButton() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runRebase = async () => {
    if (running) return;
    const confirm = window.confirm(
      'Rebase overdue cards to today using their existing intervals? This will only change due dates.'
    );
    if (!confirm) return;
    setRunning(true);
    setStatus('Rebasing...');
    const res = await fetch('/api/admin/rebase-due', { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Failed' }));
      setStatus(data.error || 'Failed to rebase');
      setRunning(false);
      return;
    }
    const data = await res.json();
    setStatus(`Rebased ${data.updated ?? 0} cards`);
    setRunning(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={runRebase} className="btn-secondary px-3 py-1 text-xs" disabled={running}>
        Rebase overdue to today
      </button>
      {status && <span className="text-[11px] text-white/70">{status}</span>}
    </div>
  );
}
