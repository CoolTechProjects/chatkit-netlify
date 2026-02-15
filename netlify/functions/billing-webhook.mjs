import { badMethod, json } from './_lib/http.mjs';
import { getDb } from './_lib/db.mjs';
import { verifyStripeEvent } from './_lib/stripe.mjs';

function unixToIso(ts) {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function mapPlan(priceId) {
  const weekly = process.env.STRIPE_WEEKLY_PRICE_ID || Netlify.env.get('STRIPE_WEEKLY_PRICE_ID');
  const monthly = process.env.STRIPE_MONTHLY_PRICE_ID || Netlify.env.get('STRIPE_MONTHLY_PRICE_ID');
  if (priceId === weekly) return 'weekly';
  if (priceId === monthly) return 'monthly';
  return null;
}

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || Netlify.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = verifyStripeEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  const db = getDb();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const userId = Number(session.metadata?.user_id);
        if (userId) {
          db.prepare('UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?').run(
            customerId,
            subscriptionId,
            userId
          );
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subscriptionId = sub.id;
        const customerId = sub.customer;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = mapPlan(priceId);
        const status = sub.status;
        const periodEnd = unixToIso(sub.current_period_end);

        db.prepare(
          `UPDATE users
           SET stripe_subscription_id = ?, plan = ?, subscription_status = ?, current_period_end = ?
           WHERE stripe_customer_id = ?`
        ).run(subscriptionId, plan, status, periodEnd, customerId);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;
        db.prepare(
          `UPDATE users
           SET stripe_subscription_id = COALESCE(stripe_subscription_id, ?), subscription_status = 'active'
           WHERE stripe_customer_id = ?`
        ).run(subscriptionId, customerId);
        break;
      }
      default:
        break;
    }

    return json({ received: true });
  } catch (error) {
    return json({ error: error.message || 'Webhook processing error' }, 500);
  }
};
