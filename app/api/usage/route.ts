import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUsageStats } from '@/lib/tools/usage';

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
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
