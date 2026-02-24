import type { APIRoute } from 'astro';

function randomToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map((n) => n.toString(16).padStart(2, '0')).join('');
}

export const GET: APIRoute = async ({ request }) => {
  const token = randomToken(16);
  const expires = new Date(Date.now() + 15 * 60 * 1000).toUTCString(); // 15 minutes

  // Determine whether to set the Secure flag. In proxied/serverless environments X-Forwarded-Proto
  // may indicate TLS even when request.url isn't https. Fall back to production assumption if unknown.
  const forwardedProto = request.headers.get('x-forwarded-proto') || request.headers.get('x-forwarded-protocol');
  const isSecure = forwardedProto === 'https' || request.url.startsWith('https:') || import.meta.env.PROD;

  const cookie = `csrf_token=${encodeURIComponent(token)}; Path=/; Expires=${expires}; SameSite=Strict;` +
    (isSecure ? ' Secure;' : '');

  return new Response(JSON.stringify({ csrfToken: token }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store',
    },
  });
};
