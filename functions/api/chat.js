/**
 * Cloudflare Pages Function — Claude API Proxy
 * POST /api/chat
 *
 * Keeps the Anthropic API key server-side.
 * Set ANTHROPIC_API_KEY as an environment variable in
 * Cloudflare Dashboard → Pages → Settings → Environment variables.
 */

const SYSTEM_PROMPT = `You are FixAlways's friendly AI assistant. FixAlways is a Florida home-services directory that helps people find trusted local pros.

Services covered: HVAC, Plumbing, Electrical, Roofing, Pest Control, Handyman.
Coverage: 188+ cities across Florida.
How it works: Users browse by city → view listings with real ratings, reviews, phone & website → contact the company directly.

Guidelines:
- Be concise, helpful, and warm.
- If someone asks about a specific city or service, suggest they browse that city page (e.g. /fl/tampa/hvac).
- You can help with general home-service questions (when to service an AC, signs of plumbing issues, etc.).
- Never make up business names or phone numbers — direct users to browse listings on the site.
- Keep responses short (2-3 sentences max unless they ask for detail).`;

export async function onRequestPost(context) {
  const apiKey = context.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await context.request.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request: messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-10),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Claude API error: ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ reply: data.content[0].text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
