export const prerender = false;

import type { APIRoute } from 'astro';
import { formatErrorMessage, createErrorResponse, extractGeminiText, getCORSHeaders, logError } from './utils';
import { CLUSTERS, isCluster } from '../../../utils/clusters';

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders(request)
  });
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseTitlesFromRss(xml: string): string[] {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
  const titles: string[] = [];
  for (const item of items) {
    const block = item[1] ?? "";
    const titleMatch =
      block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ?? block.match(/<title>(.*?)<\/title>/i);
    const title = decodeHtmlEntities(titleMatch?.[1] ?? "");
    if (!title) continue;
    titles.push(title);
  }
  return titles.slice(0, 20);
}

export const GET: APIRoute = async ({ request }) => {
  const corsHeaders = getCORSHeaders(request);

  try {
    const trendsResponse = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN",
      { headers: { Accept: "application/rss+xml, application/xml, text/xml" } }
    );

    if (!trendsResponse.ok) {
      return createErrorResponse("Unable to fetch Google Trends", 502, corsHeaders);
    }

    const rssText = await trendsResponse.text();
    const topics = parseTitlesFromRss(rssText);
    
    if (topics.length === 0) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const apiKey = import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      logError('trends', 'Gemini API key is not configured');
      return createErrorResponse('Gemini API key is not configured', 500, corsHeaders);
    }

    const prompt = `You are an Indian commerce educator.
From these trending topics: ${JSON.stringify(topics)}
Select up to 5 that are relevant to CBSE/ICSE Class 11-12 Commerce (Taxation, Business Studies, Economics, Accountancy).
Return a JSON array of objects with: 
- topic: string
- why_it_matters: string
- suggested_angle: string
- suggested_cluster: string (must be one of: ${CLUSTERS.join(', ')})

Return JSON only.`;

    const aiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logError('trends-ai-error', errorText);
      return createErrorResponse('AI filtering failed', 502, corsHeaders);
    }

    const data = await aiResponse.json();
    const generatedText = extractGeminiText(data);

    if (!generatedText) {
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      const parsed = JSON.parse(generatedText);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      
      return new Response(JSON.stringify({ items }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      });
    } catch (parseError) {
      logError('trends-parse-error', parseError, { generatedText });
      return createErrorResponse('Failed to parse AI response', 502, corsHeaders);
    }

  } catch (error) {
    logError('trends-route', error);
    return createErrorResponse(`Internal server error: ${formatErrorMessage(error)}`, 500, corsHeaders);
  }
};
