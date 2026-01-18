import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db/client';
import { keywords, keywordExpansions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { expandKeyword } from '@/lib/ai/claude';
import { checkFeatureAccess, logUsage } from '@/lib/usage';

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

    // Check usage limits
    const access = await checkFeatureAccess(
      session.userId,
      'keyword_expansion'
    );

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.message,
          upgrade: access.upgrade,
        },
        { status: 403 }
      );
    }

    // Call Claude
    const expansions = await expandKeyword(keyword.keyword, 20);

    // Save to DB
    const saved = await db.insert(keywordExpansions).values(
      expansions.map((exp) => ({
        keywordId: keyword.id,
        expansion: exp.keyword,
        relevanceScore: exp.relevance.toString(),
        method: 'claude',
      }))
    ).returning();

    // Log usage
    await logUsage(session.userId, 'keyword_expansion', {
      keywordId: keyword.id,
      count: expansions.length,
    });

    return NextResponse.json({
      success: true,
      expansions: saved,
    });
  } catch (error) {
    console.error('Expansion error:', error);
    return NextResponse.json(
      { error: 'Failed to expand keyword' },
      { status: 500 }
    );
  }
}
