import type { APIRoute } from 'astro';

const html = (script: string) =>
  `<!doctype html><html><head><meta charset="utf-8" /></head><body><script>${script}</script></body></html>`;

const sendErrorPopup = (message: string, targetOrigin: string) =>
  html(`
    (function () {
      var payload = ${JSON.stringify({ error: message })};
      if (window.opener) {
        window.opener.postMessage('authorization:github:error:' + JSON.stringify(payload), ${JSON.stringify(
          '"' + 'TARGET_ORIGIN' + '"'
        )});
      }
      window.close();
    })();
  `).replace('"TARGET_ORIGIN"', targetOrigin);

const sendSuccessPopup = (token: string, targetOrigin: string) =>
  html(`
    (function () {
      var payload = ${JSON.stringify({ provider: 'github', token })};
      if (window.opener) {
        window.opener.postMessage('authorization:github:success:' + JSON.stringify(payload), ${JSON.stringify(
          '"' + 'TARGET_ORIGIN' + '"'
        )});
      }
      window.close();
    })();
  `).replace('"TARGET_ORIGIN"', targetOrigin);

const getSiteOrigin = (request: Request) => {
  const fromUrl = new URL(request.url);
  const fromEnv = import.meta.env.SITE;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromUrl.origin || fromEnv.replace(/\/$/, '');
  }

  return fromUrl.origin;
};

const parseOrigin = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getRequestedOpenerOrigin = (request: Request) => {
  const originHeader = parseOrigin(request.headers.get('origin'));
  if (originHeader) return originHeader;

  const refererHeader = parseOrigin(request.headers.get('referer'));
  if (refererHeader) return refererHeader;

  return null;
};

const toOriginList = (value: string | undefined) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const matchOriginPattern = (origin: string, pattern: string) => {
  if (pattern === origin) return true;

  if (pattern.includes('*')) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(origin);
  }

  return false;
};

const isAllowedOrigin = (origin: string, allowedOrigins: string[]) =>
  allowedOrigins.some((pattern) => matchOriginPattern(origin, pattern));

const randomState = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
};

// base64url helpers that work in Node and browser-like runtimes
const base64UrlEncode = (input: string) => {
  if (typeof Buffer !== 'undefined') return Buffer.from(input, 'utf-8').toString('base64url');
  return btoa(unescape(encodeURIComponent(input))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const base64UrlDecode = (input: string) => {
  if (typeof Buffer !== 'undefined') return Buffer.from(input, 'base64url').toString('utf-8');
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
};

const toBase64Url = (value: string) => base64UrlEncode(value);
const fromBase64Url = (value: string) => base64UrlDecode(value);

const hmacSign = async (message: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(signature as ArrayBuffer);
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64url');
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const createSignedState = async (secret: string, openerOrigin: string) => {
  const payload = {
    nonce: randomState(),
    ts: Date.now(),
    openerOrigin,
  };

  const payloadEncoded = toBase64Url(JSON.stringify(payload));
  const signature = await hmacSign(payloadEncoded, secret);

  return `${payloadEncoded}.${signature}`;
};

const verifySignedState = async (state: string, secret: string) => {
  const [payloadEncoded, signature] = state.split('.');
  if (!payloadEncoded || !signature) return false;

  const expected = await hmacSign(payloadEncoded, secret);
  if (expected !== signature) return false;

  const payload = JSON.parse(fromBase64Url(payloadEncoded)) as { ts: number; openerOrigin?: string };
  const maxAgeMs = 10 * 60 * 1000;
  if (typeof payload.ts !== 'number') return false;

  if (Date.now() - payload.ts > maxAgeMs) return false;
  if (!payload.openerOrigin || !parseOrigin(payload.openerOrigin)) return false;

  return payload;
};

export const GET: APIRoute = async ({ request }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET;
  const stateSecret = import.meta.env.OAUTH_STATE_SECRET || clientSecret;
  const fixedCallback = import.meta.env.GITHUB_CALLBACK_URL;
  const oauthScope = import.meta.env.GITHUB_OAUTH_SCOPE || 'public_repo';

  if (!clientId || !clientSecret) {
    return new Response(sendErrorPopup('OAuth is not configured on the server.', getSiteOrigin(request)), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      status: 500,
    });
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const incomingState = requestUrl.searchParams.get('state');
  const callbackUrl = (fixedCallback && fixedCallback.length > 0
    ? fixedCallback
    : `${getSiteOrigin(request)}/api/auth`).replace(/\/$/, '');

  if (!code) {
    const openerOrigin = getRequestedOpenerOrigin(request) || getSiteOrigin(request);
    const state = await createSignedState(stateSecret, openerOrigin);

    const redirectUrl = new URL('https://github.com/login/oauth/authorize');
    redirectUrl.searchParams.set('client_id', clientId);
    redirectUrl.searchParams.set('redirect_uri', callbackUrl);
    redirectUrl.searchParams.set('scope', oauthScope);
    redirectUrl.searchParams.set('state', state);

    return Response.redirect(redirectUrl, 302);
  }

  const verifiedState = incomingState ? await verifySignedState(incomingState, stateSecret) : false;
  if (!verifiedState) {
    return new Response(sendErrorPopup('Invalid OAuth state. Please try again.', getSiteOrigin(request)), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      status: 400,
    });
  }

  const siteOrigin = getSiteOrigin(request);
  const callbackOrigin = parseOrigin(callbackUrl);
  const envAllowlist = toOriginList(import.meta.env.OAUTH_ALLOWED_ORIGINS);
  const allowedOrigins = Array.from(new Set([
    siteOrigin,
    callbackOrigin || '',
    ...envAllowlist,
    ...(import.meta.env.DEV ? ['http://localhost:4321', 'http://127.0.0.1:4321'] : []),
    'https://*.vercel.app',
  ].filter(Boolean)));

  const openerOrigin = verifiedState.openerOrigin as string;
  if (!isAllowedOrigin(openerOrigin, allowedOrigins)) {
    return new Response(sendErrorPopup('OAuth opener origin is not allowed.', siteOrigin), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      status: 400,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: callbackUrl,
  });
  if (incomingState) params.set('state', incomingState);

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    const errorMessage = tokenPayload.error_description || tokenPayload.error || 'Token exchange failed.';
    return new Response(sendErrorPopup(errorMessage, openerOrigin), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      status: 400,
    });
  }

  return new Response(sendSuccessPopup(tokenPayload.access_token, openerOrigin), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
    status: 200,
  });
};
