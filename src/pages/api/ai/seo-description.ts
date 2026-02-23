export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body } = await request.json();

    if (!title && !body) {
      return new Response(JSON.stringify({ error: 'Title or body is required' }), {
        status: 400,
      });
    }

    const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured' }), {
        status: 500,
      });
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
      console.error('Gemini API Error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
        status: 500,
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedText) {
      return new Response(JSON.stringify({ error: 'No content generated' }), { status: 500 });
    }

    return new Response(JSON.stringify({ description: generatedText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
