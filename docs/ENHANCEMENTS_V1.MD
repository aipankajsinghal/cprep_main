Architecture is stable. Blog is Astro + MDX + Content Collections.
CMS is Decap. Hosting is Netlify.
No backend expansion allowed.

This document defines the v1 InlineQuiz enhancement with final, implementation-ready decisions.

Key principles
- Static-first: all quiz data comes from frontmatter or static JSON referenced in frontmatter.
- Progressive enhancement: a minimal no-JS fallback must render sensibly; a small client script provides interactivity.
- No backend, no persistence, no external libraries.

1. Objective
Implement an `InlineQuiz` system that:
- Renders automatically when `quiz` exists in frontmatter.
- Supports optional explicit inline placement via a named-slot usage: `slot="quiz"`.
- Supports two modes: `practice` and `exam`.
- Supports optional `timeLimit` (seconds).
- Uses minimal client-side JS for interactivity; remains static-first.

2. Data Model (Locked v1 Scope)

Update content schema in `src/content/config.ts` with the following Zod schema (exact):

```ts
quiz: z
  .object({
    title: z.string().optional(),
    mode: z.enum(["practice", "exam"]).optional().default("practice"),
    // timeLimit in seconds
    timeLimit: z.number().int().positive().optional(),
    questions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).min(2),
          correctIndex: z.number().int().min(0),
          explanation: z.string().optional()
        })
      )
      .min(1)
      .max(7)
  })
  .optional();
```

Rules enforced by schema:
- `correctIndex` is required and must be a valid index (build-time validation will catch invalid values).
- Maximum of 7 questions enforced by schema (`.max(7)`).
- Single-select only (no multi-select in v1).
- No shuffle in v1.

If `quiz` is missing or `questions` is empty → nothing renders.

3. Authoring Example (Frontmatter)

Add the `quiz` block to the post frontmatter. `timeLimit` is in seconds.

```md
---
title: "Sample Post"
quiz:
  title: "Quick GST Practice"
  mode: "exam"
  timeLimit: 180
  questions:
    - question: "GST is which type of tax?"
      options:
        - Direct Tax
        - Indirect Tax
        - Wealth Tax
        - Corporate Tax
      correctIndex: 1
      explanation: "GST is an indirect tax because..."
    - question: "Input Tax Credit reduces:"
      options:
        - Output liability
        - Income tax
        - Salary
        - Imports
      correctIndex: 0
---
```

4. Rendering Rules (final)

Implement dual rendering logic:
- Rule 1 — Explicit placement: If an author places `<InlineQuiz slot="quiz" />` in the MDX page, render the quiz at that position via a named slot.
- Rule 2 — Auto-render: If no inline usage exists and `quiz` data exists, the layout auto-renders the quiz in the post flow (before CTAs).
- Rule 3 — If no quiz data → render nothing.
- Rule 4 — Inline placement overrides auto-render to avoid duplication.

5. Layout Changes (implementation-ready snippet)

In `src/layouts/BlogLayout.astro`:

```astro
---
import InlineQuiz from "../components/InlineQuiz.astro";
const quizData = (Astro.props as any).entry?.data?.quiz;
const hasInlineQuiz = Astro.slots?.has && Astro.slots.has("quiz");
---

<article class="editorial" data-pagefind-body>
  <slot />
  <slot name="quiz" />
  {!hasInlineQuiz && quizData?.questions?.length > 0 && (
    <section class="post-quiz-section">
      <InlineQuiz quiz={quizData} />
    </section>
  )}
</article>
```

6. InlineQuiz Component Requirements

Create `src/components/InlineQuiz.astro` (implementation phase). Props:

```ts
quiz: {
  title?: string
  mode?: "practice" | "exam"
  timeLimit?: number // seconds
  questions: Array<{
    question: string
    options: string[]
    correctIndex: number
    explanation?: string
  }>
}
```

7. Behavior Specification

Practice Mode (default)
- Immediate feedback on option click.
- Correct/incorrect styling and live score updates.
- Explanation shown after selection.

Exam Mode
- Selections stored silently; no immediate feedback.
- Shows `Submit Answers` button (or auto-submit when timer expires).
- On submit: calculate score, reveal correct answers and explanations, and lock inputs.

Timer
- `timeLimit` is expressed in seconds.
- Timer starts on the first answer selection by default (authors may opt into an explicit "Start" button later — not in v1).
- Timer is visible as `Time left: MM:SS` and auto-submits when it reaches zero.

8. Accessibility Requirements

- Use semantic `form`, `fieldset`, `legend`, and `label`.
- Ensure keyboard-navigable radios, visible focus states, and high-contrast success/error states.
- Use an `aria-live` region for score and submission feedback.
- Timer should be announced with an appropriate ARIA role (e.g., `role="timer"` and `aria-live="polite"`).

9. Styling Requirements

- Lavendar accent border and subtle warm background using design tokens from `src/styles/tokens.css`.
- Rounded corners using `--shape-radius`.
- No heavy animations; lightweight transitions only.
- Compact card layout that respects editorial typography.

10. Progressive Enhancement

No-JS fallback (required):
- Render questions and options as static form elements.
- Include a `details` element labeled "Reveal answers" containing correct answers and explanations so readers can view results without JS.

JS Enhancement (minimal inline script):
- Scoring, exam logic, timer, per-question feedback, and auto-submit.
- No external libraries; script must be small and only hydrate the quiz area.

11. Analytics Hook (Optional)

On quiz completion call the optional hook:

```js
window.cpTrack?.("quiz_completed", {
  mode,
  score,
  total,
  timeTaken
});
```

Do NOT send any PII through this hook.

12. Guardrails

- No persistence, no backend storage, no ranking, no login.
- Keep the JS minimal to avoid increasing global bundle size.

13. Testing Checklist (expanded)

- Post without quiz renders normally.
- Post with quiz auto-renders correctly.
- Inline placement via `slot="quiz"` works.
- Practice mode gives immediate feedback correctly.
- Exam mode hides feedback until submit.
- Timer auto-submits and locks inputs.
- No hydration or build-time errors.
- Build-time validation errors surface for malformed quiz frontmatter (missing `correctIndex`, invalid index, >7 questions).
- Pagefind indexing includes quiz text if using frontmatter.

Implementation Scope (v1)
- Practice mode
- Exam mode
- Timer (start on first selection)

Future Phase (post-v1)
- Shuffle, multi-select, AI quiz generation, and advanced analytics.

Final Constraint
- Do not introduce: backend APIs, databases, SSR, auth systems, or third-party quiz libraries.

This enhancement is editorial and static-first — not an LMS.