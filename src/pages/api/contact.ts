import type { APIRoute } from 'astro';
import { incrementAndGet, sendEmailViaResend } from '../../lib/contact';

const HONEYPOT_FIELD = 'website_url'; // honeypot field name
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 submissions per minute per IP

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(name + '=')) return decodeURIComponent(c.substring(name.length + 1));
  }
  return null;
}

function getRateLimitKey(ip: string): string {
  return `contact_${ip}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid content type',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse body
    let data;
    try {
      data = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, message, csrfToken } = data;

    // Validate field types
    if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Fields name, email, and message must be strings',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: name, email, message',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Honeypot check
    if (data[HONEYPOT_FIELD]) {
      // Silently return success to avoid revealing honeypot
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CSRF double-submit cookie check
    const cookieHeader = request.headers.get('cookie');
    const cookieToken = getCookieValue(cookieHeader, 'csrf_token');
    if (!cookieToken || cookieToken !== csrfToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid CSRF token',
          timestamp: new Date().toISOString(),
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting using Upstash (if configured) or in-memory fallback
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rlKey = getRateLimitKey(clientIp);
    const rl = await incrementAndGet(rlKey, RATE_LIMIT_WINDOW / 1000);
    if (rl.count > RATE_LIMIT_MAX) {
      const retryAfterSec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many submissions. Please try again later.',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
          },
        }
      );
    }

    // Validate message length (prevent spam/abuse)
    if (message.length < 10 || message.length > 5000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Message must be between 10 and 5000 characters',
          timestamp: new Date().toISOString(),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend (values are validated and escaped inside sendEmailViaResend)
    const emailResult = await sendEmailViaResend(email, name, message);

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error || 'Failed to send message',
          timestamp: new Date().toISOString(),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
