import { badMethod, json } from './_lib/http.mjs';
import { getUserBySession } from './_lib/session.mjs';
import { hasActiveAccess } from './_lib/access.mjs';

export default async (req) => {
  if (req.method !== 'GET') return badMethod();
  const session = getUserBySession(req);
  if (!session) return json({ authenticated: false }, 401);

  const { user } = session;
  return json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      trial_started_at: user.trial_started_at,
      trial_expires_at: user.trial_expires_at,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id,
      plan: user.plan,
      current_period_end: user.current_period_end,
      subscription_status: user.subscription_status,
      has_access: hasActiveAccess(user),
    },
  });
};
