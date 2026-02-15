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
  const decoded = Buffer.from(b64, "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx === -1) return null;
  return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

export const handler = async (event) => {
  // 1) Basic Auth
  const expectedUser = process.env.BASIC_USER;
  const expectedPass = process.env.BASIC_PASS;

  const auth = event.headers?.authorization || event.headers?.Authorization;
  const creds = parseBasicAuth(auth);

  if (!creds) return unauthorized();
  if (creds.user !== expectedUser || creds.pass !== expectedPass) return unauthorized();

  // 2) Metoda
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // 3) Body
  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch {}
  const userId = payload.user || "anonymous";

  // 4) ENV
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.CHATKIT_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Brak OPENAI_API_KEY lub CHATKIT_WORKFLOW_ID w Netlify." }),
    };
  }

  // 5) OpenAI
  const resp = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "OpenAI-Beta": "chatkit_beta=v1",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ workflow: { id: workflowId }, user: userId }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    return {
      statusCode: resp.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_secret: data.client_secret }),
  };
};
