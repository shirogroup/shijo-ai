import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'User not found or no Stripe customer' },
        { status: 404 }
      );
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/dashboard`,
    });
    
    return NextResponse.json({
      url: session.url,
    });
    
  } catch (error) {
    console.error('Portal session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
