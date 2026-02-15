function unauthorized() {
  return {
    statusCode: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
    body: "Unauthorized",
  };
}

function parseBasicAuth(authHeader) {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;

  const b64 = authHeader.slice(6).trim();

  // Buffer zwykle działa w Netlify Functions, ale jakby nie działał, możesz użyć atob().
  let decoded;
  try {
    decoded = Buffer.from(b64, "base64").toString("utf8");
  } catch (e) {
    try {
      decoded = atob(b64);
    } catch {
      return null;
    }
  }

  const idx = decoded.indexOf(":");
  if (idx === -1) return null;

  return {
    user: decoded.slice(0, idx),
    pass: decoded.slice(idx + 1),
  };
}

export const handler = async (event, context) => {
  // ✅ DODAJ TO NA SAMYM POCZĄTKU HANDLERA
  const expectedUser = process.env.BASIC_USER;
  const expectedPass = process.env.BASIC_PASS;

  const auth = event.headers?.authorization || event.headers?.Authorization;
  const creds = parseBasicAuth(auth);

  if (!creds) return unauthorized();
  if (creds.user !== expectedUser || creds.pass !== expectedPass) return unauthorized();

  // 🔽 dalej Twój dotychczasowy kod funkcji (bez zmian)
  // ...

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { user } = await req.json().catch(() => ({}));

  // Netlify Functions: env w runtime przez Netlify.env :contentReference[oaicite:6]{index=6}
  const apiKey = Netlify.env.get("OPENAI_API_KEY");
  const workflowId = Netlify.env.get("CHATKIT_WORKFLOW_ID");

  if (!apiKey || !workflowId) {
    return new Response(
      JSON.stringify({ error: "Brak OPENAI_API_KEY lub CHATKIT_WORKFLOW_ID w Netlify." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // OpenAI zaleca, żeby `user` był unikalny per użytkownik końcowy :contentReference[oaicite:7]{index=7}
  const userId = user || "anonymous";

  const resp = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      workflow: { id: workflowId },
      user: userId,
    }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ client_secret: data.client_secret }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
};
