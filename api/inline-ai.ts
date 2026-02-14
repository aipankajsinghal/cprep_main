export const config = {
  runtime: "edge"
};

const SYSTEM_PROMPT =
  "You are a CBSE commerce tutor. Provide concise educational explanations suitable for class 11-12 students.";

function badRequest(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body: { topic?: string; context?: string; type?: string } = {};
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const topic = String(body.topic ?? "").trim().slice(0, 160);
  const context = String(body.context ?? "").trim().slice(0, 1200);
  const type = String(body.type ?? "").trim();

  if (!topic || !context || !["simplify", "exam-summary", "example"].includes(type)) {
    return badRequest("Invalid payload");
  }

  const userPrompt = `Topic: ${topic}\nAction: ${type}\nContext:\n${context}`;

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      max_output_tokens: 150,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: "Upstream AI request failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = (await upstream.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  let output = data.output_text ?? "";
  if (!output && Array.isArray(data.output)) {
    for (const part of data.output) {
      if (!Array.isArray(part.content)) continue;
      for (const block of part.content) {
        if (block?.type === "output_text" && typeof block.text === "string") {
          output += block.text;
        }
      }
    }
  }

  const cleaned = output.replace(/\s+/g, " ").trim().slice(0, 320);
  return new Response(JSON.stringify({ output: cleaned }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
