const SYSTEM_PROMPT =
  "You are a CBSE commerce tutor. Provide concise educational explanations suitable for class 11-12 students.";

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Missing OPENAI_API_KEY" });
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const topic = String(body.topic ?? "").trim().slice(0, 160);
  const context = String(body.context ?? "").trim().slice(0, 1200);
  const type = String(body.type ?? "").trim();

  if (!topic || !context || !["simplify", "exam-summary", "example"].includes(type)) {
    return jsonResponse(400, { error: "Invalid payload" });
  }

  const userPrompt = `Topic: ${topic}\nAction: ${type}\nContext:\n${context}`;

  try {
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
      return jsonResponse(502, { error: "Upstream AI request failed" });
    }

    const data = await upstream.json();
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

    const cleaned = String(output).replace(/\s+/g, " ").trim().slice(0, 320);
    return jsonResponse(200, { output: cleaned });
  } catch (err) {
    return jsonResponse(502, { error: "Upstream AI request failed" });
  }
};
