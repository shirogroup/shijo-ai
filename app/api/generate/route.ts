import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getToolById } from '@/lib/tools/registry';
import { PROMPTS } from '@/lib/tools/prompts';
import { getSession } from '@/lib/auth';
import { checkToolAccess, recordToolUsage } from '@/lib/tools/usage';
import { serverErrorResponse } from '@/lib/api/errors';
import { correctCharacterCounts, toolStatesCharacterCounts, ACCURACY_GUARD, LENGTH_LABEL_GUARD, NO_SELF_MEASUREMENT_GUARD } from '@/lib/tools/output';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model mapping based on tool's modelTier
const MODEL_MAP = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
} as const;

// Longest single input field we will forward to the model. Output was already
// capped by max_tokens; input was not capped at all, so one pasted document in
// a textarea field (e.g. AI Overview Optimizer's "Page URL or Content") could
// bill an unbounded number of input tokens. 20k chars is far more than any
// legitimate use of these fields and still cheap.
const MAX_FIELD_CHARS = 20_000;

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

    // ── Validate request shape before doing anything else ───────────
    // (Catches the empty/malformed-body case with a message that says
    // what's actually wrong, instead of interpolating "undefined".)
    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Request is missing a required "toolId" field.' },
        { status: 400 }
      );
    }

    // ── Validate tool exists ────────────────────────────────────────
    const tool = getToolById(toolId);
    if (!tool) {
      return NextResponse.json(
        { success: false, error: `Unknown tool: "${toolId}". Check the tool ID matches one in the registry.` },
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

    // ── Validate the inputs themselves ──────────────────────────────
    // The registry marks fields `required: true` and the form honours that,
    // but the form is not the only caller. Before this check, a request with
    // `inputs: {}` returned 200, consumed one of the user's generations and
    // billed real tokens for output that began "Since the page topic and
    // target keyword are undefined...". Client-side validation is a courtesy;
    // this is the actual rule.
    const suppliedInputs: Record<string, unknown> = (inputs && typeof inputs === 'object') ? inputs : {};

    const missing = tool.fields
      .filter((f) => f.required)
      .filter((f) => {
        const v = suppliedInputs[f.id];
        return typeof v !== 'string' || v.trim() === '';
      })
      .map((f) => f.label);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Please fill in: ${missing.join(', ')}`,
          missingFields: missing,
        },
        { status: 400 }
      );
    }

    const tooLong = tool.fields
      .filter((f) => {
        const v = suppliedInputs[f.id];
        return typeof v === 'string' && v.length > MAX_FIELD_CHARS;
      })
      .map((f) => f.label);

    if (tooLong.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Too long (limit ${MAX_FIELD_CHARS.toLocaleString()} characters): ${tooLong.join(', ')}`,
        },
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
    // Only the tools with a real, unambiguous length budget are asked to state
    // one; everything else is told not to measure its own output at all.
    const statesCounts = toolStatesCharacterCounts(toolId);
    // D-35: the "never state a measurement" rule and the "keep the (N characters)
    // label" rule used to be appended together and contradicted each other, so the
    // label — and therefore the recount — appeared on only ~60% of runs. They are
    // now mutually exclusive: tools whose counts are recomputed get the label rule,
    // every other tool gets the prohibition.
    const userPrompt =
      promptBuilder(inputs || {}) +
      ACCURACY_GUARD +
      (statesCounts ? LENGTH_LABEL_GUARD : NO_SELF_MEASUREMENT_GUARD);

    // ── Call Claude API ─────────────────────────────────────────────
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // ── Extract text from response ──────────────────────────────────
    const rawResult = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    // Replace any "(N characters)" the model wrote with the real count — but
    // only for tools whose output format makes the target unambiguous.
    const result = statesCounts ? correctCharacterCounts(rawResult) : rawResult;

    // ── Record usage (after successful generation) ──────────────────
    // Both counts. input_tokens was previously read and thrown away, which is
    // what made spend impossible to reconstruct — input and output bill at
    // different rates.
    const inputTokens = message.usage?.input_tokens || 0;
    const outputTokens = message.usage?.output_tokens || 0;

    await recordToolUsage(session.userId, toolId, model, inputTokens, outputTokens);

    return NextResponse.json({
      success: true,
      result,
      meta: {
        model: effectiveModelTier,
        toolId: tool.id,
        tokensUsed: outputTokens,
        inputTokens,
        remaining: access.remaining !== undefined
          ? (access.remaining === -1 ? -1 : access.remaining - 1)
          : undefined,
        period: access.period,
      },
    });
  } catch (error) {
    return serverErrorResponse('GEN', 'Generate API error', error, 'Generation failed.');
  }
}
