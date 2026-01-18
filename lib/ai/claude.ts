// lib/ai/claude.ts
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callClaude(
  prompt: string,
  options: {
    maxTokens?: number;
    model?: string;
  } = {}
): Promise<string> {
  const {
    maxTokens = 2000,
    model = 'claude-sonnet-4-20250514',
  } = options;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to get response from Claude');
  }
}

// Feature 2: Keyword Expansion
export async function expandKeyword(
  keyword: string,
  count: number = 20
): Promise<Array<{ keyword: string; relevance: number; intent: string }>> {
  const prompt = `You are an expert SEO keyword researcher.

Generate ${count} long-tail keyword variations for: "${keyword}"

Requirements:
- All variations must be relevant to the seed keyword
- Include informational, commercial, and transactional intent keywords
- Use natural language (as users would search)
- Include question-based keywords
- Provide a relevance score (0-1) for each

Return ONLY a JSON array with this structure:
[
  {
    "keyword": "best ${keyword} for beginners",
    "relevance": 0.95,
    "intent": "commercial"
  }
]

JSON array:`;

  const response = await callClaude(prompt, { maxTokens: 4000 });
  
  try {
    const json = JSON.parse(response);
    return json;
  } catch (error) {
    console.error('Failed to parse keyword expansion response:', error);
    throw new Error('Invalid response format');
  }
}

// Feature 3: Intent Classification
export async function classifyIntent(
  keyword: string
): Promise<{ intent: string; confidence: number; reasoning: string }> {
  const prompt = `Classify the search intent for: "${keyword}"

Search intent categories:
- informational: User wants to learn/understand (how to, what is, guide)
- commercial: User is researching to buy (best, top, review, compare)
- transactional: User is ready to buy (buy, price, discount, near me)
- navigational: User wants a specific site/brand (login, official, brand name)

Return ONLY a JSON object:
{
  "intent": "commercial",
  "confidence": 0.95,
  "reasoning": "Keyword indicates user is comparing options before purchase"
}

JSON:`;

  const response = await callClaude(prompt);
  
  try {
    const json = JSON.parse(response);
    return json;
  } catch (error) {
    console.error('Failed to parse intent classification response:', error);
    throw new Error('Invalid response format');
  }
}

// Feature 4: Keyword Clustering
export async function clusterKeywords(
  keywords: string[]
): Promise<Array<{ name: string; keywords: number[] }>> {
  const prompt = `Group these keywords into semantic clusters.

Keywords:
${keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}

Rules:
- Create 3-7 clusters based on topic similarity
- Give each cluster a descriptive name
- Keywords can only belong to one cluster
- Prioritize user intent similarity over exact word matching

Return ONLY a JSON object:
{
  "clusters": [
    {
      "name": "Beginner Guides",
      "keywords": [1, 3, 7]
    }
  ]
}

JSON:`;

  const response = await callClaude(prompt, { maxTokens: 4000 });
  
  try {
    const json = JSON.parse(response);
    return json.clusters;
  } catch (error) {
    console.error('Failed to parse clustering response:', error);
    throw new Error('Invalid response format');
  }
}

// Feature 5: Opportunity Scoring
export async function scoreOpportunity(
  keyword: string,
  context?: {
    intent?: string;
    cluster?: string;
    expansions?: string[];
  }
): Promise<{
  score: number;
  explanation: string;
  factors: {
    volume_potential: number;
    competition: number;
    intent_clarity: number;
    relevance: number;
    content_gap: number;
  };
  recommendation: string;
}> {
  const prompt = `Score the SEO opportunity for: "${keyword}"

Context:
- Intent: ${context?.intent || 'unknown'}
- Cluster: ${context?.cluster || 'none'}
- Related keywords: ${context?.expansions?.slice(0, 5).join(', ') || 'none'}

Scoring factors (0-100):
- Search volume potential
- Competition level (lower = better)
- Intent clarity (higher = better)
- Topical relevance
- Content gap opportunity

Return ONLY a JSON object:
{
  "score": 78,
  "explanation": "High opportunity due to clear commercial intent and low competition",
  "factors": {
    "volume_potential": 85,
    "competition": 60,
    "intent_clarity": 95,
    "relevance": 80,
    "content_gap": 70
  },
  "recommendation": "Target with commercial content (product comparison, buying guide)"
}

JSON:`;

  const response = await callClaude(prompt, { maxTokens: 2000 });
  
  try {
    const json = JSON.parse(response);
    return json;
  } catch (error) {
    console.error('Failed to parse opportunity scoring response:', error);
    throw new Error('Invalid response format');
  }
}
