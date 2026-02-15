const COMMERCE_KEYWORDS = [
  "tax",
  "gst",
  "budget",
  "rbi",
  "inflation",
  "economy",
  "economics",
  "finance",
  "bank",
  "stock",
  "market",
  "income",
  "corporate",
  "business",
  "commerce",
  "accountancy",
  "cbse",
  "icse",
  "class 11",
  "class 12"
];

const CLUSTERS = [
  "taxation",
  "accountancy",
  "business-studies",
  "economics",
  "finance",
  "corporate-law",
  "tips-tricks",
  "shortcuts",
  "mindmaps",
  "quick-quiz"
];

function isCluster(value) {
  return CLUSTERS.includes(value);
}

function jsonResponse(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}

function decodeHtmlEntities(text) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function parseTitlesFromRss(xml) {
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi));
  const titles = [];
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

function scoreTopic(topic) {
  const lower = topic.toLowerCase();
  return COMMERCE_KEYWORDS.reduce((score, keyword) => score + (lower.includes(keyword) ? 1 : 0), 0);
}

function inferCluster(topic) {
  const lower = topic.toLowerCase();
  if (lower.includes("tax") || lower.includes("gst") || lower.includes("income")) return "taxation";
  if (lower.includes("account") || lower.includes("ledger") || lower.includes("audit")) return "accountancy";
  if (lower.includes("corporate") || lower.includes("law")) return "corporate-law";
  if (lower.includes("economy") || lower.includes("inflation") || lower.includes("rbi")) return "economics";
  if (lower.includes("stock") || lower.includes("market") || lower.includes("bank") || lower.includes("finance")) {
    return "finance";
  }
  if (lower.includes("business") || lower.includes("commerce")) return "business-studies";
  return "tips-tricks";
}

function normalizeTrend(item) {
  const topic = String(item.topic ?? "").trim().slice(0, 140);
  const why = String(item.why_it_matters ?? "").trim().slice(0, 280);
  const angle = String(item.suggested_angle ?? "").trim().slice(0, 280);
  const cluster = String(item.suggested_cluster ?? "").trim();
  if (!topic || !why || !angle) return null;
  return {
    topic,
    why_it_matters: why,
    suggested_angle: angle,
    suggested_cluster: isCluster(cluster) ? cluster : inferCluster(topic)
  };
}

function baselineFromTopics(topics) {
  return topics
    .slice(0, 5)
    .map((topic) => ({
      topic,
      why_it_matters: "This trend can be connected to current affairs and exam-oriented commerce concepts.",
      suggested_angle: "Explain the trend in simple terms, then connect it to Class 11-12 syllabus outcomes.",
      suggested_cluster: inferCluster(topic)
    }))
    .map(normalizeTrend)
    .filter(Boolean);
}

async function fetchAiFilteredTopics(topics, apiKey) {
  const prompt = `You are an Indian commerce educator.\nFrom these trending topics: ${JSON.stringify(
    topics
  )}\nSelect up to 5 that are relevant to CBSE/ICSE Class 11-12 Commerce (Taxation, Business Studies, Economics, Accountancy).\nReturn JSON array with: topic, why_it_matters, suggested_angle, suggested_cluster.\nReturn JSON only, no markdown.`;

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      max_output_tokens: 600,
      input: [
        { role: "system", content: "You return clean JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!upstream.ok) return null;
  const payload = await upstream.json();
  const text = String(payload.output_text ?? "").trim();
  if (!text) return null;

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    const normalized = parsed.map(normalizeTrend).filter(Boolean).slice(0, 5);
    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== "GET") return jsonResponse(405, { error: "Method not allowed" });

  try {
    const trendsResponse = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN",
      { headers: { Accept: "application/rss+xml, application/xml, text/xml" } }
    );

    if (!trendsResponse.ok) return jsonResponse(502, { error: "Unable to fetch Google Trends" });

    const rssText = await trendsResponse.text();
    const topics = parseTitlesFromRss(rssText);
    if (topics.length === 0) return jsonResponse(200, { items: [] });

    const keywordMatches = topics
      .map((topic) => ({ topic, score: scoreTopic(topic) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.topic);

    if (keywordMatches.length >= 5) return jsonResponse(200, { items: baselineFromTopics(keywordMatches) });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const fallbackTopics = [...keywordMatches, ...topics].slice(0, 5);
      return jsonResponse(200, { items: baselineFromTopics(fallbackTopics) });
    }

    const aiItems = await fetchAiFilteredTopics(topics, apiKey);
    if (aiItems && aiItems.length > 0) return jsonResponse(200, { items: aiItems.slice(0, 5) });

    const fallbackTopics = [...keywordMatches, ...topics].slice(0, 5);
    return jsonResponse(200, { items: baselineFromTopics(fallbackTopics) });
  } catch (err) {
    return jsonResponse(502, { error: "Trends fetch failed" });
  }
};
