'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCardForm() {
  const [tab, setTab] = useState<'text' | 'image'>('text');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const router = useRouter();

  const submitText = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');
    const res = await fetch('/api/sources/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back, text: front, tags: tags ? tags.split(',').map((t) => t.trim()) : [] })
    });
    if (res.ok) {
      setStatus('Created!');
      router.push('/cards');
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed' }));
      setStatus(data.error || 'Failed to create card');
    }
  };

  const submitImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please choose an image');
      return;
    }
    setStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    if (front) formData.append('front', front);
    if (back) formData.append('back', back);

    const res = await fetch('/api/sources/image', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({ error: 'Failed' }));
    if (!res.ok) {
      setStatus(data.error || 'Upload failed');
      return;
    }
    setOcrPreview(data.ocr?.markdown || data.ocr?.latex || data.ocr?.text || '');
    setFront(data.card?.front || front);
    setBack(data.card?.back || back);
    setStatus('Created card from image');
    router.push(`/cards/${data.card?.id ?? ''}`);
  };

  return (
    <div className="glass-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Add new</p>
          <h1 className="text-3xl font-semibold text-white">Create a card</h1>
        </div>
        <div className="flex gap-2 rounded-full border border-white/10 p-1 text-sm">
          <button
            className={`rounded-full px-4 py-1 ${tab === 'text' ? 'bg-accent text-midnight-900' : 'text-white/60'}`}
            onClick={() => setTab('text')}
            type="button"
          >
            Text card
          </button>
          <button
            className={`rounded-full px-4 py-1 ${tab === 'image' ? 'bg-accent text-midnight-900' : 'text-white/60'}`}
            onClick={() => setTab('image')}
            type="button"
          >
            Image card
          </button>
        </div>
      </div>

      {tab === 'text' ? (
        <form className="space-y-4" onSubmit={submitText}>
          <div>
            <label className="mb-1 block text-sm text-white/70">Question (front)</label>
            <textarea className="textarea-field" rows={5} value={front} onChange={(e) => setFront(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Answer (back)</label>
            <textarea className="textarea-field" rows={6} value={back} onChange={(e) => setBack(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Tags (comma separated)</label>
            <input className="input-field" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          {status && <p className="text-sm text-white/70">{status}</p>}
          <button type="submit" className="btn-primary">
            Save card
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={submitImage}>
          <div>
            <label className="mb-1 block text-sm text-white/70">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-white/70"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Question (front) override</label>
            <textarea
              className="textarea-field"
              rows={4}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Leave blank to use OCR output"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Answer (back)</label>
            <textarea className="textarea-field" rows={4} value={back} onChange={(e) => setBack(e.target.value)} />
          </div>
          {ocrPreview && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
              <div className="mb-1 font-semibold text-white">OCR preview</div>
              <pre className="whitespace-pre-wrap">{ocrPreview}</pre>
            </div>
          )}
          {status && <p className="text-sm text-white/70">{status}</p>}
          <button type="submit" className="btn-primary">
            Upload & create
          </button>
        </form>
      )}
    </div>
  );
}
