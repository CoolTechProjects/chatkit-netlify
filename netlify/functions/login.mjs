export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const expectedUser = Netlify.env.get("BASIC_USER");
  const expectedPass = Netlify.env.get("BASIC_PASS");

  if (!expectedUser || !expectedPass) {
    return new Response(
      JSON.stringify({ error: "Brak BASIC_USER lub BASIC_PASS w Netlify." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { username, password } = await req.json().catch(() => ({}));

  if (username !== expectedUser || password !== expectedPass) {
    return new Response(JSON.stringify({ error: "Niepoprawny login lub haslo." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
