/**
 * Contact form utilities: rate limiting and email sending via Resend.
 *
 * Rate limiting uses Upstash Redis for multi-instance deployments
 * (set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN).
 * Falls back to in-memory store for single-instance deployments.
 *
 * Email is sent via Resend's REST API (no SDK dependency).
 * Required env vars: RESEND_API_KEY, CONTACT_TO_EMAIL
 */

/* ---------- Rate Limiting ---------- */

interface RateLimitResult {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number; timestamp: number }>();

// Cleanup memory store periodically to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now >= value.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

/**
 * Increment a rate-limit counter using Upstash Redis or memory store.
 * @param key       Unique key (e.g. IP-based)
 * @param windowSec Sliding window in seconds
 */
export async function incrementAndGet(
  key: string,
  windowSec: number,
): Promise<RateLimitResult> {
  const upstashUrl = import.meta.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = import.meta.env.UPSTASH_REDIS_REST_TOKEN;

  // Use Upstash Redis if configured
  if (upstashUrl && upstashToken) {
    try {
      const rateKey = `rate-limit:${key}`;

      // Atomic increment and get
      const response = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', rateKey],
          ['EXPIRE', rateKey, windowSec],
          ['TTL', rateKey],
        ]),
      });

      if (response.ok) {
        const data = await response.json() as any[];
        const count = data[0]?.result || 1;
        const ttl = data[2]?.result || windowSec;
        const resetAt = Date.now() + ttl * 1000;
        return { count, resetAt };
      }
    } catch (error) {
      // Fall back to memory store on Redis failure
      console.warn('[Rate Limit] Upstash Redis error, falling back to memory store:', error);
    }
  }

  // Use in-memory store for single-instance deployments
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const result = { count: 1, resetAt: now + windowSec * 1000, timestamp: now };
    memoryStore.set(key, result);
    return { count: 1, resetAt: result.resetAt };
  }

  entry.count += 1;
  entry.timestamp = now;
  return { count: entry.count, resetAt: entry.resetAt };
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
