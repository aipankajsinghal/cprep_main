export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, body } = await request.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'Title and body are required' }), {
        status: 400,
      });
    }

    const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured' }), {
        status: 500,
      });
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
      return new Response(JSON.stringify({ error: `Gemini API failed with status ${response.status}: ${errorText}` }), {
        status: 500,
      });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedText) {
      console.error('Gemini response missing text:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: 'No content generated - response format invalid' }), { status: 500 });
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
      return new Response(JSON.stringify({ error: `Invalid JSON from AI: ${parseError instanceof Error ? parseError.message : String(parseError)}` }), { status: 500 });
    }
    
  } catch (error) {
    console.error('API Route Error:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` }), { status: 500 });
  }
};
