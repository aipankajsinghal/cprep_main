export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return res.status(405).send({ error: 'Method not allowed' })

    const { title, body } = req.body || {}

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' })
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key is not configured' })
    }

    const prompt = `You are an expert educator. Based on the following article, create a 5-question multiple-choice quiz.
You must return the response as a pure JSON object that strictly matches this schema:

{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "A short sentence explaining why this is the correct answer."
    }
  ]
}

DO NOT include any markdown formatting. Return ONLY valid JSON.

Article Title: ${title}
Article Content:
${(body || '').substring(0, 4000)}`

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

    try {
      const cleanText = generatedText.replace(/^```json/m, '').replace(/```$/m, '').trim()
      const parsed = JSON.parse(cleanText)
      return res.status(200).json({ questions: parsed.questions })
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', generatedText)
      return res.status(500).json({ error: 'Invalid JSON from AI' })
    }

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
