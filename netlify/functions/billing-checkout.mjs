import { badMethod, json, readJson } from './_lib/http.mjs';
import { getUserBySession } from './_lib/session.mjs';
import { getDb } from './_lib/db.mjs';
import { createCheckoutSession, createOrFindCustomer } from './_lib/stripe.mjs';

const PLAN_MAP = {
  weekly: process.env.STRIPE_WEEKLY_PRICE_ID || Netlify.env.get('STRIPE_WEEKLY_PRICE_ID'),
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || Netlify.env.get('STRIPE_MONTHLY_PRICE_ID'),
};

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const session = getUserBySession(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const { plan } = await readJson(req);
  if (!PLAN_MAP[plan]) return json({ error: 'Nieznany plan.' }, 400);

  const appUrl = process.env.APP_URL || Netlify.env.get('APP_URL') || 'http://localhost:8888';
  const db = getDb();

  try {
    const customer = await createOrFindCustomer(session.user.email, session.user.stripe_customer_id);

    if (!session.user.stripe_customer_id) {
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customer.id, session.user.id);
    }

    const checkout = await createCheckoutSession({
      customerId: customer.id,
      priceId: PLAN_MAP[plan],
      successUrl: `${appUrl}/billing/success`,
      cancelUrl: `${appUrl}/billing/cancel`,
      metadata: { userId: String(session.user.id) },
    });

    return json({ url: checkout.url });
  } catch (error) {
    return json({ error: error.message || 'Nie udalo sie utworzyc sesji Stripe.' }, 500);
  }
};
