export function hasActiveAccess(user) {
  const now = Date.now();

  if (user?.trial_expires_at && new Date(user.trial_expires_at).getTime() > now) {
    return true;
  }

  const activeStatuses = new Set(['active', 'trialing', 'past_due']);
  if (
    user?.subscription_status &&
    activeStatuses.has(user.subscription_status) &&
    user?.current_period_end &&
    new Date(user.current_period_end).getTime() > now
  ) {
    return true;
  }

  return false;
}
