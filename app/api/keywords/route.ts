import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { keywords } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyword, language = 'en', country = 'us' } = await req.json();

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const [newKeyword] = await db.insert(keywords).values({
      userId: session.userId,
      keyword: keyword.trim(),
      language,
      country,
    }).returning();

    return NextResponse.json({ success: true, keyword: newKeyword });
  } catch (error) {
    console.error('Create keyword error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userKeywords = await db.query.keywords.findMany({
      where: eq(keywords.userId, session.userId),
      orderBy: [desc(keywords.createdAt)],
      limit: 100,
    });

    return NextResponse.json({ keywords: userKeywords });
  } catch (error) {
    console.error('Get keywords error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
