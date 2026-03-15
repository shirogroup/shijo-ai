import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getToolById } from '@/lib/tools/registry';
import { PROMPTS } from '@/lib/tools/prompts';
import { getSession } from '@/lib/auth';
import { checkToolAccess, recordToolUsage } from '@/lib/tools/usage';

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
    // ── Auth check ──────────────────────────────────────────────────
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to use AI tools' },
        { status: 401 }
      );
    }

    const { toolId, inputs } = await req.json();

    // ── Validate tool exists ────────────────────────────────────────
    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Unknown tool: ${toolId}` },
        { status: 400 }
      );
    }

    // ── Validate prompt builder exists ──────────────────────────────
    const promptBuilder = PROMPTS[toolId];
    if (!promptBuilder) {
      return NextResponse.json(
        { success: false, error: `No prompt builder for tool: ${toolId}` },
        { status: 400 }
      );
    }

    // ── Check API key ───────────────────────────────────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // ── Plan & usage check ──────────────────────────────────────────
    const access = await checkToolAccess(session.userId, toolId);

    if (!access.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: access.reason,
          upgradePrompt: access.upgradePrompt,
          remaining: access.remaining,
          limit: access.limit,
          period: access.period,
        },
        { status: 403 }
      );
    }

    // ── Determine effective model ───────────────────────────────────
    // Free tier is always forced to Haiku regardless of tool config
    const effectiveModelTier = access.effectiveModel || tool.modelTier;
    const model = MODEL_MAP[effectiveModelTier];
    const maxTokens = MAX_TOKENS_MAP[effectiveModelTier];

    // ── Build prompt ────────────────────────────────────────────────
    const userPrompt = promptBuilder(inputs || {});

    // ── Call Claude API ─────────────────────────────────────────────
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // ── Extract text from response ──────────────────────────────────
    const result = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    // ── Record usage (after successful generation) ──────────────────
    await recordToolUsage(
      session.userId,
      toolId,
      model,
      message.usage?.output_tokens || 0
    );

    return NextResponse.json({
      success: true,
      result,
      meta: {
        model: effectiveModelTier,
        toolId: tool.id,
        tokensUsed: message.usage?.output_tokens || 0,
        remaining: access.remaining !== undefined
          ? (access.remaining === -1 ? -1 : access.remaining - 1)
          : undefined,
        period: access.period,
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
