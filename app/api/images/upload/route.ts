import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/authSession';
import { saveImage } from '@/lib/images';

export async function POST(req: Request) {
  const { userId, response } = await requireUser();
  if (!userId) return response!;

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = await saveImage({ userId, buffer, mimeType: file.type || 'image/png' });
    return NextResponse.json({
      id: image.id,
      url: `/api/images/${image.id}`,
      size: image.size,
      mimeType: image.mimeType
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
