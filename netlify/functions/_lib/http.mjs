export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function badMethod() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function readJson(req) {
  return req.json().catch(() => ({}));
}
