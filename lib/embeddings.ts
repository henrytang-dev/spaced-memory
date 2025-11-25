import { prisma } from './prisma';

const OPENAI_URL = 'https://api.openai.com/v1/embeddings';

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embedding failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.data[0].embedding as number[];
}

export async function updateCardEmbedding(cardId: string, userId: string, text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return;
  }
  try {
    const embedding = await embedText(text);
    const vectorLiteral = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`
      INSERT INTO "CardEmbedding" ("cardId", "userId", "embedding", "createdAt", "updatedAt")
      VALUES (${cardId}, ${userId}, ${vectorLiteral}::vector, NOW(), NOW())
      ON CONFLICT ("cardId")
      DO UPDATE SET "embedding" = EXCLUDED."embedding", "userId" = EXCLUDED."userId", "updatedAt" = NOW();
    `;
  } catch (err) {
    console.error('Failed to update embedding', err);
  }
}

export async function searchByEmbedding(userId: string, embedding: number[], limit = 10) {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }
  const vector = `[${embedding.join(',')}]`;
  const results = await prisma.$queryRawUnsafe<
    { cardId: string; score: number }[]
  >(
    `SELECT "cardId" as "cardId", 1 - (embedding <=> $1::vector) as score FROM "CardEmbedding" WHERE "userId" = $2 ORDER BY embedding <=> $1::vector ASC LIMIT $3`,
    vector,
    userId,
    limit
  );
  return results;
}
