'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCardForm() {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [tags, setTags] = useState('');
  // OCR-only uploads (not kept)
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  // Reference images to keep & render during review
  const [refFrontFile, setRefFrontFile] = useState<File | null>(null);
  const [refBackFile, setRefBackFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const router = useRouter();

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/images/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.id as string;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');

    const hasOcrImages = !!frontFile || !!backFile;
    let questionImageId: string | undefined;
    let answerImageId: string | undefined;

    // Optional reference images (kept for review display)
    try {
      if (refFrontFile) {
        questionImageId = await uploadImage(refFrontFile);
      }
      if (refBackFile) {
        answerImageId = await uploadImage(refBackFile);
      }
    } catch (err) {
      console.error(err);
      setStatus('Failed to upload reference image');
      return;
    }

    if (hasOcrImages) {
      const formData = new FormData();
      if (frontFile) formData.append('frontImage', frontFile);
      if (backFile) formData.append('backImage', backFile);
      if (front) formData.append('front', front);
      if (back) formData.append('back', back);
      if (questionImageId) formData.append('questionImageId', questionImageId);
      if (answerImageId) formData.append('answerImageId', answerImageId);
      const res = await fetch('/api/sources/image', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({ error: 'Failed' }));
      if (!res.ok) {
        setStatus(data.error || 'Upload failed');
        return;
      }
      setOcrPreview(data.ocr?.front?.markdown || data.ocr?.front?.latex || data.ocr?.front?.text || '');
      setFront(data.card?.front || front);
      setBack(data.card?.back || back);
      setStatus('Created card from image');
      router.refresh();
      router.push(`/cards/${data.card?.id ?? ''}`);
      return;
    }

    if (!front || !back) {
      setStatus('Front and back are required when no images are provided');
      return;
    }

    const res = await fetch('/api/sources/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        front,
        back,
        text: front,
        tags: tags ? tags.split(',').map((t) => t.trim()) : [],
        questionImageId,
        answerImageId
      })
    });
    if (res.ok) {
      const created = await res.json();
      setStatus('Created!');
      router.refresh();
      router.push(`/cards/${created.id ?? 'cards'}`);
    } else {
      const data = await res.json().catch(() => ({ error: 'Failed' }));
      setStatus(data.error || 'Failed to create card');
    }
  };

  return (
    <div className="glass-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Add new</p>
          <h1 className="text-3xl font-semibold text-white">Create a card</h1>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/80 transition hover:border-accent"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFrontFile(f);
            }}
          >
            <div className="font-semibold text-white">Question image for OCR (not kept)</div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center hover:border-accent">
              {frontFile ? `Selected: ${frontFile.name}` : 'Click or drag to upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-white/60">Used only for OCR; image is discarded.</p>
          </div>
          <div
            className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/80 transition hover:border-accent"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setBackFile(f);
            }}
          >
            <div className="font-semibold text-white">Answer image for OCR (not kept)</div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center hover:border-accent">
              {backFile ? `Selected: ${backFile.name}` : 'Click or drag to upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setBackFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-white/60">Used only for OCR; image is discarded.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition hover:border-accent"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setRefFrontFile(f);
            }}
          >
            <div className="font-semibold text-white">Reference image for question (kept)</div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center hover:border-accent">
              {refFrontFile ? `Selected: ${refFrontFile.name}` : 'Click or drag to upload (optional)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setRefFrontFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-white/60">Stored and shown on the card during review.</p>
          </div>
          <div
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 transition hover:border-accent"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setRefBackFile(f);
            }}
          >
            <div className="font-semibold text-white">Reference image for answer (kept)</div>
            <label className="cursor-pointer rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center hover:border-accent">
              {refBackFile ? `Selected: ${refBackFile.name}` : 'Click or drag to upload (optional)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setRefBackFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-xs text-white/60">Stored and shown on the card during review.</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/70">Question (front)</label>
          <textarea
            className="textarea-field"
            rows={5}
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Leave blank to use OCR output from the question image"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">Answer (back)</label>
          <textarea
            className="textarea-field"
            rows={6}
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Leave blank to use OCR output from the answer image"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">Tags (comma separated)</label>
          <input className="input-field" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        {ocrPreview && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
            <div className="mb-1 font-semibold text-white">OCR preview</div>
            <pre className="whitespace-pre-wrap">{ocrPreview}</pre>
          </div>
        )}
        {status && <p className="text-sm text-white/70">{status}</p>}
        <button type="submit" className="btn-primary">
          Save card
        </button>
      </form>
    </div>
  );
}
