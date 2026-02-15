import { createHmac, timingSafeEqual } from 'node:crypto';

const API_BASE = 'https://api.stripe.com/v1';

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY || Netlify.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
  return key;
}

async function stripeRequest(path, formData) {
  const secret = getSecretKey();
  const body = new URLSearchParams(formData);

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error?.message || 'Stripe API error');
  }

  return payload;
}

export async function createOrFindCustomer(email, existingCustomerId) {
  if (existingCustomerId) return { id: existingCustomerId };
  return stripeRequest('/customers', { email });
}

export async function createCheckoutSession({ customerId, priceId, successUrl, cancelUrl, metadata }) {
  const data = {
    mode: 'subscription',
    customer: customerId,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: successUrl,
    cancel_url: cancelUrl,
    'metadata[user_id]': metadata.userId,
  };

  return stripeRequest('/checkout/sessions', data);
}

export function verifyStripeEvent(rawBody, signatureHeader, webhookSecret) {
  if (!signatureHeader || !webhookSecret) {
    throw new Error('Missing Stripe signature or webhook secret');
  }

  const elements = Object.fromEntries(
    signatureHeader.split(',').map((item) => {
      const [k, v] = item.split('=');
      return [k, v];
    })
  );

  const timestamp = elements.t;
  const signature = elements.v1;
  if (!timestamp || !signature) throw new Error('Invalid Stripe signature header');

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(rawBody);
}
