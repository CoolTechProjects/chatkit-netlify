function text(statusCode, body, headers = {}) {
  return { statusCode, headers, body };
}

function json(statusCode, obj, headers = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(obj),
  };
}

function unauthorized() {
  return text(401, "Unauthorized", {
    "WWW-Authenticate": 'Basic realm="Restricted"',
  });
}

function getBasicCreds(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization;
  if (!auth || !auth.startsWith("Basic ")) return null;

  const decoded = Buffer.from(auth.slice(6).trim(), "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx === -1) return null;

  return { user: decoded.slice(0, idx), pass: decoded.slice(idx + 1) };
}

export const handler = async (event) => {
  // 1) Basic Auth (na samej górze)
  const expectedUser = process.env.BASIC_USER;
  const expectedPass = process.env.BASIC_PASS;

  if (!expectedUser || !expectedPass) {
    return text(500, "Missing BASIC_USER/BASIC_PASS env vars");
  }

  const creds = getBasicCreds(event);
  if (!creds || creds.user !== expectedUser || creds.pass !== expectedPass) {
    return unauthorized();
  }

  // 2) Metoda
  if (event.httpMethod !== "POST") {
    return text(405, "Method Not Allowed", { Allow: "POST" });
  }

  // 3) Body
  let payload = {};
  try {
    payload = event.body ? JSON.parse(event.body) : {};
  } catch {
    payload = {};
  }
  const userId = payload.user || "anonymous";

  // 4) ENV
  const apiKey = process.env.OPENAI_API_KEY;
  const workflowId = process.env.CHATKIT_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    return json(500, { error: "Brak OPENAI_API_KEY lub CHATKIT_WORKFLOW_ID w env." });
  }

  // 5) OpenAI ChatKit sessions
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
    return json(resp.status, data);
  }

  return json(200, { client_secret: data.client_secret });
};
