export type AssistantAction = "simplify" | "exam-summary" | "example";

interface RequestInput {
  endpoint?: string;
  action: AssistantAction;
  topic: string;
  contextText: string;
  cacheKey?: string;
}

interface FallbackPayload {
  simplify?: string[];
  "exam-summary"?: string[];
  example?: string[];
}

const FALLBACK_ENDPOINT = "/data/assistant-responses.json";
let endpointAvailable = true;
const runtimeCache = new Map<string, string>();
let staticPayloadPromise: Promise<FallbackPayload> | null = null;

function concise(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 260) return normalized;
  return `${normalized.slice(0, 257).trimEnd()}...`;
}

function hashKey(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFallback(payload: FallbackPayload, action: AssistantAction, seed = ""): string {
  const options = payload[action] ?? [];
  if (!options.length) return "Focus on the core concept, then solve one question before moving forward.";
  const index = hashKey(`${action}:${seed}`) % options.length;
  return options[index];
}

async function getStaticPayload(): Promise<FallbackPayload> {
  if (!staticPayloadPromise) {
    staticPayloadPromise = fetch(`${FALLBACK_ENDPOINT}?t=${Date.now()}`, { cache: "no-store" }).then((response) => {
      if (!response.ok) throw new Error("assistant_fallback_failed");
      return response.json() as Promise<FallbackPayload>;
    });
  }
  return staticPayloadPromise;
}

export function getCachedRuntimeResponse(cacheKey?: string): string | undefined {
  if (!cacheKey) return undefined;
  return runtimeCache.get(cacheKey);
}

export async function getStaticResponse(action: AssistantAction, seed = ""): Promise<string> {
  const payload = await getStaticPayload();
  return concise(pickFallback(payload, action, seed));
}

export async function requestRuntimeHint(input: RequestInput): Promise<string> {
  const { endpoint, action, topic, contextText, cacheKey } = input;

  if (endpoint && endpointAvailable) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: topic.slice(0, 160),
          context: contextText.slice(0, 1200),
          type: action
        })
      });

      if (!response.ok) {
        throw new Error("assistant_request_failed");
      }

      const data = await response.json();
      if (!data || typeof data.output !== "string") {
        throw new Error("assistant_invalid_payload");
      }
      const value = concise(data.output);
      if (cacheKey) runtimeCache.set(cacheKey, value);
      return value;
    } catch {
      // Keep static-first behavior when runtime API is unavailable on static hosting.
      endpointAvailable = false;
      throw new Error("assistant_request_failed");
    }
  }

  throw new Error("assistant_endpoint_unavailable");
}
