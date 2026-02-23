export const prerender = false;

import type { APIRoute } from 'astro';
import { formatErrorMessage, createErrorResponse, extractGeminiText } from './utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body } = await request.json();

    if (!title || !body) {
      return createErrorResponse('Title and body are required', 400);
    }

    const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return createErrorResponse('Gemini API key is not configured', 500);
    }

    const prompt = `You are an expert educator. Based on the following article, create a 5-question multiple-choice quiz.
You must return the response as a pure JSON object that strictly matches this schema:

{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0, // integer 0-3 representing the index of the correct option
      "explanation": "A short sentence explaining why this is the correct answer."
    }
  ]
}

DO NOT include any markdown formatting like \`\`\`json. Return ONLY valid JSON.

Article Title: ${title}
Article Content:
${body?.substring(0, 4000) || ''}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
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

    try {
      // Sometimes the model might include markdown fences despite instructions
      const cleanText = generatedText.replace(/^```json/m, '').replace(/```$/m, '').trim();
      const parsed = JSON.parse(cleanText);

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Response missing questions array');
      }

      return new Response(JSON.stringify({ questions: parsed.questions }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', generatedText);
      return createErrorResponse(`Invalid JSON from AI: ${formatErrorMessage(parseError)}`);
    }

  } catch (error) {
    console.error('API Route Error:', formatErrorMessage(error));
    return createErrorResponse(`Internal server error: ${formatErrorMessage(error)}`);
  }
};
