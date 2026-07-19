import { NextRequest, NextResponse } from 'next/server';
import { serverErrorResponse } from '@/lib/api/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Set cookie deletion directly on NextResponse (consistent with login route)
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    return serverErrorResponse('LGO', 'Logout error', error, 'Could not log you out right now.');
  }
}
