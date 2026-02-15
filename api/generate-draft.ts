import { isCluster } from "../src/utils/clusters";

export const config = {
  runtime: "edge"
};

interface DraftRequest {
  topic?: string;
  angle?: string;
  cluster?: string;
}

interface DraftResponse {
  title: string;
  description: string;
  body: string;
  tags: string[];
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function sanitizeDraft(payload: Partial<DraftResponse>, fallbackTopic: string, cluster: string): DraftResponse {
  const title = String(payload.title ?? fallbackTopic).trim().slice(0, 150) || fallbackTopic;
  const description = String(payload.description ?? "").trim().slice(0, 220) || `${fallbackTopic} explained for commerce students.`;
  const body =
    String(payload.body ?? "")
      .replace(/\r\n/g, "\n")
      .trim()
      .slice(0, 12000) || `## Introduction\n${fallbackTopic}\n`;
  const rawTags = Array.isArray(payload.tags) ? payload.tags : [];
  const tags = Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter((tag) => tag.length > 1 && tag.length <= 32)
    )
  ).slice(0, 5);

  if (!tags.length) {
    tags.push(cluster, "commerce");
  }

  return { title, description, body, tags };
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: "Missing OPENAI_API_KEY" });
  }

  let body: DraftRequest = {};
  try {
    body = (await request.json()) as DraftRequest;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const topic = String(body.topic ?? "").trim().slice(0, 160);
  const angle = String(body.angle ?? "").trim().slice(0, 200);
  const cluster = String(body.cluster ?? "").trim();

  if (!topic || !angle || !isCluster(cluster)) {
    return jsonResponse(400, { error: "Invalid payload" });
  }

  const prompt = `Write a structured blog post for Indian Class 11-12 Commerce students.

Topic: ${topic}
Angle: ${angle}
Cluster: ${cluster}

Requirements:
- Clear introduction explaining relevance
- 4-6 sections with H2 headings
- Simple, accessible language
- At least one real-world Indian example
- Exam relevance noted where applicable
- Brief summary at end
- Do NOT include frontmatter

Output format: Return JSON with keys: title, description (1 sentence), body (markdown), tags (array of 3-5 strings).
Return JSON only.`;

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      max_output_tokens: 2000,
      input: [
        { role: "system", content: "You are an Indian commerce educator. Return valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!upstream.ok) {
    return jsonResponse(502, { error: "Upstream AI request failed" });
  }

  const payload = (await upstream.json()) as { output_text?: string };
  const outputText = String(payload.output_text ?? "").trim();
  const parsed = parseJsonObject(outputText);
  if (!parsed) {
    return jsonResponse(502, { error: "Invalid AI output format" });
  }

  const draft = sanitizeDraft(parsed as Partial<DraftResponse>, topic, cluster);
  return jsonResponse(200, draft);
}
