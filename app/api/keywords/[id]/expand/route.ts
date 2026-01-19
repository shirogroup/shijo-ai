import { NextResponse } from 'next/server';
import { db } from '@/db';
import { keywords, keywordExpansions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15, params is now a Promise that must be awaited
    const { id: keywordId } = await params;

    // Get keyword
    const [keyword] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.id, keywordId))
      .limit(1);

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword not found' },
        { status: 404 }
      );
    }

    // Call Claude to expand keyword
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Generate 10-15 long-tail keyword variations for: "${keyword.keyword}"

These should be:
- Longer, more specific versions
- Natural language questions
- Related search queries
- Different angles/intent variations

Respond in JSON format:
{
  "expansions": [
    "long tail keyword 1",
    "long tail keyword 2",
    ...
  ]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text);

    // Save all expansions to DB
    const saved = await db.insert(keywordExpansions).values(
      result.expansions.map((expansion: string) => ({
        keywordId: keyword.id,
        expansion,
        method: 'claude-ai',
      }))
    ).returning();

    return NextResponse.json({
      success: true,
      count: saved.length,
      data: saved,
    });

  } catch (error) {
    console.error('Error expanding keyword:', error);
    return NextResponse.json(
      { error: 'Failed to expand keyword' },
      { status: 500 }
    );
  }
}
