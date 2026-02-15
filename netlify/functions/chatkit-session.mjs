import { badMethod, json, readJson } from './_lib/http.mjs';
import { getUserBySession } from './_lib/session.mjs';
import { hasActiveAccess } from './_lib/access.mjs';

export default async (req) => {
  if (req.method !== 'POST') return badMethod();

  const session = getUserBySession(req);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasActiveAccess(session.user)) return json({ error: 'Brak aktywnego dostepu.' }, 402);

  const { user } = await readJson(req);
  const apiKey = process.env.OPENAI_API_KEY || Netlify.env.get('OPENAI_API_KEY');
  const workflowId = process.env.CHATKIT_WORKFLOW_ID || Netlify.env.get('CHATKIT_WORKFLOW_ID');

  if (!apiKey || !workflowId) {
    return json({ error: 'Brak OPENAI_API_KEY lub CHATKIT_WORKFLOW_ID.' }, 500);
  }

  const userId = user || `user_${session.user.id}`;

  const resp = await fetch('https://api.openai.com/v1/chatkit/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'chatkit_beta=v1',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      workflow: { id: workflowId },
      user: userId,
      chatkit_configuration: {
        file_upload: {
          enabled: true,
          max_files: 5,
          max_file_size: 10,
        },
      },
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return json(data, resp.status);

  return json({ client_secret: data.client_secret });
};
