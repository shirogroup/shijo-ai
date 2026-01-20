import { NextResponse } from 'next/server';
import { db } from '../../../../../db';
import { keywords, keywordIntents } from '../../../../../db/schema';
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
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid keyword ID format' },
        { status: 400 }
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
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Classify the search intent for this keyword: "${keyword.keyword}". Return ONLY a JSON object with: {"intent": "informational|navigational|commercial|transactional", "confidence": 0.0-1.0}`
        }
      ],
    });
    
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const result = JSON.parse(responseText);
    
    await db.insert(keywordIntents).values({
      keywordId: keyword.id,
      intent: result.intent,
      confidence: result.confidence.toString(),
    });
    
    return NextResponse.json({
      intent: result.intent,
      confidence: result.confidence,
    });
    
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Failed to classify keyword' },
      { status: 500 }
    );
  }
}
