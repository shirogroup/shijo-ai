import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users,
  termsAcceptances,
  subscriptions,
  credits,
  usageLogs,
  userQuotas,
  keywords,
  keywordClusters,
  contentBriefs,
  pageAudits,
  metaSuggestions,
  aeoScores,
  aiVisibility,
  aiSimulations,
  seoForecasts,
  seoStrategies,
  seoTasks,
  rankHistory,
  rankSnapshots,
} from '@/db/schema';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// GDPR Art. 20 / CCPA data-portability endpoint. Returns every record tied
// to the requesting user's own userId, across every table that stores
// user-owned data, as a single downloadable JSON file. Deliberately scoped
// to session.userId only — never accepts a userId from the request body,
// so a user can only ever export their own data.
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = session.userId;

    const [
      profile,
      terms,
      subs,
      creditHistory,
      usage,
      quota,
      kw,
      clusters,
      briefs,
      audits,
      metaSugg,
      aeo,
      visibility,
      simulations,
      forecasts,
      strategies,
      tasks,
      ranks,
      snapshots,
    ] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, uid) }),
      db.query.termsAcceptances.findMany({ where: eq(termsAcceptances.userId, uid) }),
      db.query.subscriptions.findMany({ where: eq(subscriptions.userId, uid) }),
      db.query.credits.findMany({ where: eq(credits.userId, uid) }),
      db.query.usageLogs.findMany({ where: eq(usageLogs.userId, uid) }),
      db.query.userQuotas.findFirst({ where: eq(userQuotas.userId, uid) }),
      db.query.keywords.findMany({ where: eq(keywords.userId, uid) }),
      db.query.keywordClusters.findMany({ where: eq(keywordClusters.userId, uid) }),
      db.query.contentBriefs.findMany({ where: eq(contentBriefs.userId, uid) }),
      db.query.pageAudits.findMany({ where: eq(pageAudits.userId, uid) }),
      db.query.metaSuggestions.findMany({ where: eq(metaSuggestions.userId, uid) }),
      db.query.aeoScores.findMany({ where: eq(aeoScores.userId, uid) }),
      db.query.aiVisibility.findMany({ where: eq(aiVisibility.userId, uid) }),
      db.query.aiSimulations.findMany({ where: eq(aiSimulations.userId, uid) }),
      db.query.seoForecasts.findMany({ where: eq(seoForecasts.userId, uid) }),
      db.query.seoStrategies.findMany({ where: eq(seoStrategies.userId, uid) }),
      db.query.seoTasks.findMany({ where: eq(seoTasks.userId, uid) }),
      db.query.rankHistory.findMany({ where: eq(rankHistory.userId, uid) }),
      db.query.rankSnapshots.findMany({ where: eq(rankSnapshots.userId, uid) }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Strip internal auth fields — a data-portability export is not the
    // place to include a password hash, even though it's not usable on
    // its own.
    const { passwordHash: _passwordHash, ...safeProfile } = profile;

    const exportPayload = {
      exportGeneratedAt: new Date().toISOString(),
      exportFormat: 'SHIJO.AI account data export v1',
      profile: safeProfile,
      termsAndPrivacyAcceptances: terms,
      subscriptions: subs,
      creditHistory,
      usageLogs: usage,
      quota: quota ?? null,
      keywords: kw,
      keywordClusters: clusters,
      contentBriefs: briefs,
      pageAudits: audits,
      metaSuggestions: metaSugg,
      aeoScores: aeo,
      aiVisibilityScans: visibility,
      aiSimulations: simulations,
      seoForecasts: forecasts,
      seoStrategies: strategies,
      seoTasks: tasks,
      rankHistory: ranks,
      rankSnapshots: snapshots,
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shijo-ai-data-export-${uid}.json"`,
      },
    });
  } catch (error) {
    console.error('Account export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
