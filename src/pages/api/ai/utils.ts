/**
 * Formats error messages consistently
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Handles Gemini API errors and returns a standardized Response
 */
export function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), { status });
}

/**
 * Extracts text from Gemini response
 */
export function extractGeminiText(data: any): string | null {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
}
