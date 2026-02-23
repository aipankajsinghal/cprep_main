export const prerender = false;

import type { APIRoute } from 'astro';
import { formatErrorMessage, createErrorResponse, extractGeminiText } from './utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body } = await request.json();

    if (!title && !body) {
      return createErrorResponse('Title or body is required', 400);
    }

    const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return createErrorResponse('Gemini API key is not configured', 500);
    }

    const prompt = `You are an expert SEO copywriter.
Write a compelling, concise meta description for this article.
It must be under 155 characters.
It should be engaging and encourage clicks.
Do not wrap it in quotes or introductory text.

Title: ${title}
Content:
${body?.substring(0, 2000) || ''}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      return createErrorResponse(`Gemini API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const generatedText = extractGeminiText(data);

    if (!generatedText) {
      console.error('Gemini response missing text:', JSON.stringify(data));
      return createErrorResponse('No content generated - response format invalid');
    }

    return new Response(JSON.stringify({ description: generatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Route Error:', formatErrorMessage(error));
    return createErrorResponse(`Internal server error: ${formatErrorMessage(error)}`);
  }
};
