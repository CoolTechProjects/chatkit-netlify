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

  const authHeader = req.headers.get("authorization") || "";
  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Basic realm="chatkit"',
      },
    });
  }

  let username = "";
  let password = "";
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error("Invalid auth payload");
    }
    username = decoded.slice(0, separatorIndex);
    password = decoded.slice(separatorIndex + 1);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (username !== expectedUser || password !== expectedPass) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user } = await req.json().catch(() => ({}));

  const apiKey = Netlify.env.get("OPENAI_API_KEY");
  const workflowId = Netlify.env.get("CHATKIT_WORKFLOW_ID");

  if (!apiKey || !workflowId) {
    return new Response(
      JSON.stringify({ error: "Brak OPENAI_API_KEY lub CHATKIT_WORKFLOW_ID w Netlify." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

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
