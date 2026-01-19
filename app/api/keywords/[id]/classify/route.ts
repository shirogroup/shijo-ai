import { NextResponse } from 'next/server';
import { db } from '@/db';
import { keywords, keywordIntents } from '@/db/schema';
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

    // Call Claude to classify intent
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent for this keyword: "${keyword.keyword}"

Possible intents:
- informational (user wants to learn)
- navigational (user wants to find a specific site)
- commercial (user is researching before buying)
- transactional (user wants to buy/do something)

Respond in JSON format:
{
  "intent": "one of the four types",
  "confidence": 0.95
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = JSON.parse(content.text);

    // Save to DB
    const [saved] = await db.insert(keywordIntents).values({
      keywordId: keyword.id,
      intent: result.intent,
      confidence: result.confidence.toString(),
    }).returning();

    return NextResponse.json({
      success: true,
      data: saved,
    });

  } catch (error) {
    console.error('Error classifying keyword:', error);
    return NextResponse.json(
      { error: 'Failed to classify keyword' },
      { status: 500 }
    );
  }
}
