export function calculateMinutesRead(rawContent: string): number {
  const text = rawContent
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_\-~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugifyTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function extractFaqItemsFromBody(rawContent: string): FaqItem[] {
  const lines = rawContent.split(/\r?\n/);
  const items: FaqItem[] = [];

  let currentQuestion = "";
  let answerLines: string[] = [];

  const flush = () => {
    const answer = answerLines.join(" ").replace(/\s+/g, " ").trim();
    if (currentQuestion && answer) {
      items.push({ question: currentQuestion, answer });
    }
    currentQuestion = "";
    answerLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)\s*$/);
    if (headingMatch) {
      flush();
      currentQuestion = headingMatch[1].trim();
      continue;
    }

    if (/^#{1,6}\s+/.test(line) && currentQuestion) {
      flush();
      continue;
    }

    if (currentQuestion && line.trim()) {
      answerLines.push(line.trim());
    }
  }

  flush();
  return items;
}
