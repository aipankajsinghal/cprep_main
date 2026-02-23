import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' })

    const { title, body } = req.body || {}

    if (!title && !body) {
      return res.status(400).json({ error: 'Title or body is required' })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' })
    }

    const prompt = `You are an expert SEO copywriter.
Write a compelling, concise meta description for this article.
It must be under 155 characters.
It should be engaging and encourage clicks.
Do not wrap it in quotes or introductory text.

Title: ${title}
Content:
${(body || '').substring(0, 2000)}`

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
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error:', errorText)
      return res.status(500).json({ error: 'Failed to generate content' })
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!generatedText) {
      return res.status(500).json({ error: 'No content generated' })
    }

    return res.status(200).json({ description: generatedText })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
