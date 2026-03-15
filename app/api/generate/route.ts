import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getToolById } from '@/lib/tools/registry';
import { PROMPTS } from '@/lib/tools/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model mapping based on tool's modelTier
const MODEL_MAP = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20241022',
} as const;

// Max tokens by model tier (haiku tasks are shorter)
const MAX_TOKENS_MAP = {
  haiku: 1024,
  sonnet: 2048,
} as const;

export async function POST(req: NextRequest) {
  try {
    const { toolId, inputs } = await req.json();

    // Validate tool exists
    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Unknown tool: ${toolId}` },
        { status: 400 }
      );
    }

    // Validate prompt builder exists
    const promptBuilder = PROMPTS[toolId];
    if (!promptBuilder) {
      return NextResponse.json(
        { success: false, error: `No prompt builder for tool: ${toolId}` },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build prompt
    const userPrompt = promptBuilder(inputs || {});

    // Select model based on tool tier
    const model = MODEL_MAP[tool.modelTier];
    const maxTokens = MAX_TOKENS_MAP[tool.modelTier];

    // Call Claude API
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text from response
    const result = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    return NextResponse.json({
      success: true,
      result,
      meta: {
        model: tool.modelTier,
        toolId: tool.id,
        tokensUsed: message.usage?.output_tokens || 0,
      },
    });
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { success: false, error: 'Generation failed. Please try again.' },
      { status: 500 }
    );
  }
}
