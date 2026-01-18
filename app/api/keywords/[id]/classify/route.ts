import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db/client';
import { keywords, keywordIntents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { classifyIntent } from '@/lib/ai/claude';
import { logUsage } from '@/lib/usage';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get keyword
    const keyword = await db.query.keywords.findFirst({
      where: eq(keywords.id, params.id),
    });

    if (!keyword || keyword.userId !== session.userId) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Call Claude
    const result = await classifyIntent(keyword.keyword);

    // Save to DB
    const [saved] = await db.insert(keywordIntents).values({
      keywordId: keyword.id,
      intent: result.intent,
      confidence: result.confidence.toString(),
      reasoning: result.reasoning,
    }).returning();

    // Log usage
    await logUsage(session.userId, 'intent_classification', {
      keywordId: keyword.id,
    });

    return NextResponse.json({
      success: true,
      intent: saved,
    });
  } catch (error) {
    console.error('Intent classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify intent' },
      { status: 500 }
    );
  }
}
