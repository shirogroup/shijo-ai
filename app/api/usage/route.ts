import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUsageStats } from '@/lib/tools/usage';
import { serverErrorResponse } from '@/lib/api/errors';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const stats = await getUsageStats(session.userId);

    return NextResponse.json({ success: true, usage: stats });
  } catch (error) {
    return serverErrorResponse('USG', 'Usage API error', error, 'Could not load your usage stats.');
  }
}
