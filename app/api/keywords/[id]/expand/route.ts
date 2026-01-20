import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { keywords, keywordExpansions, userQuotas } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { userId } = await req.json();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID format' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    const [quota] = await db
      .select()
      .from(userQuotas)
      .where(eq(userQuotas.userId, userId))
      .limit(1);
    
    if (!quota) {
      return NextResponse.json(
        { error: 'User quota not found' },
        { status: 404 }
      );
    }
    
    const expansionsUsed = quota.expansionsUsed ?? 0;
    const expansionsQuota = quota.expansionsQuota ?? 0;
    
    if (expansionsUsed >= expansionsQuota) {
      return NextResponse.json(
        { error: 'Expansion quota exceeded', quotaExceeded: true },
        { status: 429 }
      );
    }
    
    const [keyword] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, id))
      .limit(1);
    
    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }
    
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Generate 20 long-tail keyword variations for: "${keyword.keyword}". Return ONLY a JSON array of strings: ["keyword1", "keyword2", ...]`
        }
      ],
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const expansions = JSON.parse(responseText);
    
    const insertPromises = expansions.map((expansion: string) =>
      db.insert(keywordExpansions).values({
        keywordId: keyword.id,
        expansion,
        method: 'ai',
      })
    );
    
    await Promise.all(insertPromises);
    
    await db
      .update(userQuotas)
      .set({
        expansionsUsed: expansionsUsed + 1,
        updatedAt: new Date(),
      })
      .where(eq(userQuotas.userId, userId));
    
    return NextResponse.json({
      expansions,
      quotaRemaining: expansionsQuota - expansionsUsed - 1,
    });
    
  } catch (error) {
    console.error('Expansion error:', error);
    return NextResponse.json(
      { error: 'Failed to expand keyword' },
      { status: 500 }
    );
  }
}
