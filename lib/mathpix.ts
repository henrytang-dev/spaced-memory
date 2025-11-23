const MATHPIX_URL = 'https://api.mathpix.com/v3/text';

type MathpixResponse = {
  text?: string;
  latex_styled?: string;
  markdown?: string;
};

export async function parseMathpixImage(buffer: Buffer) {
  if (!process.env.MATHPIX_APP_ID || !process.env.MATHPIX_APP_KEY) {
    throw new Error('Mathpix credentials are not set');
  }

  const body = {
    src: `data:image/png;base64,${buffer.toString('base64')}`,
    formats: ['text', 'latex_styled', 'markdown'],
    data_options: {
      include_asciimath: false
    }
  };

  const res = await fetch(MATHPIX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      app_id: process.env.MATHPIX_APP_ID,
      app_key: process.env.MATHPIX_APP_KEY
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const bodyText = await res.text();
    throw new Error(`Mathpix request failed: ${res.status} ${bodyText}`);
  }

  const data = (await res.json()) as MathpixResponse;
  return {
    text: data.text ?? '',
    latex: data.latex_styled ?? '',
    markdown: (data as any).markdown ?? data.text ?? ''
  };
}
