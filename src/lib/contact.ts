/**
 * Contact form utilities: rate limiting and email sending via Resend.
 *
 * Rate limiting uses an in-memory store (suitable for single-instance
 * serverless). For multi-instance deployments, swap in Upstash Redis
 * by setting UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 *
 * Email is sent via Resend's REST API (no SDK dependency).
 * Required env vars: RESEND_API_KEY, CONTACT_TO_EMAIL
 */

/* ---------- Rate Limiting ---------- */

interface RateLimitResult {
  count: number;
  resetAt: number;
}

const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Increment a rate-limit counter for `key`.
 * @param key       Unique key (e.g. IP-based)
 * @param windowSec Sliding window in seconds
 */
export async function incrementAndGet(
  key: string,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    const result = { count: 1, resetAt: now + windowSec * 1000 };
    store.set(key, result);
    return result;
  }

  entry.count += 1;
  return entry;
}

/* ---------- Email via Resend ---------- */

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendEmailViaResend(
  senderEmail: string,
  senderName: string,
  message: string,
): Promise<EmailResult> {
  const apiKey = import.meta.env.RESEND_API_KEY;
  const toEmail = import.meta.env.CONTACT_TO_EMAIL;

  if (!apiKey || !toEmail) {
    return {
      success: false,
      error: 'Email service is not configured.',
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ChampionsPrep Contact <noreply@${import.meta.env.RESEND_FROM_DOMAIN || 'championsprep.in'}>`,
        to: [toEmail],
        reply_to: senderEmail,
        subject: `Contact form: ${senderName}`,
        text: [
          `Name: ${senderName}`,
          `Email: ${senderEmail}`,
          '',
          'Message:',
          message,
        ].join('\n'),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Resend API error (${res.status}): ${body}` };
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
