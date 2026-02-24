/**
 * Helper to get CORS headers
 */
export function getCORSHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  // Allow localhost (dev) and your production domains
  const allowedOrigins = [
    'http://localhost:4321', // Astro dev
    'http://localhost:3333', // Sanity Studio local
    'https://c-prep-blog.vercel.app',
    'https://www.championsprep.in'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.sanity.studio'))) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }

  // Fallback to minimal CORS
  return {
    'Access-Control-Allow-Origin': 'https://www.championsprep.in',
  };
}

/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Detailed error logging for server-side debugging
 */
export function logError(context: string, error: unknown, extra?: any) {
  const message = formatErrorMessage(error);
  console.error(`[AI API ERROR] ${context}:`, {
    message,
    timestamp: new Date().toISOString(),
    ...extra
  });
}

/**
 * Handles Gemini API errors and returns a standardized Response
 */
export function createErrorResponse(message: string, status: number = 500, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: message }), { 
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * Extracts text from Gemini response
 */
export function extractGeminiText(data: any): string | null {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}
