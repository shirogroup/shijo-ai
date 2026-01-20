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
    const { priceId, userId, mode = 'subscription' } = await req.json();
    
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId' },
        { status: 400 }
      );
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shijo.ai'}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });
    
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
    
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
