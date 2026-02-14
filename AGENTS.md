Ambiguous behavior must never be guessed. If unclear, request clarification instead of implementing assumptions.
Environment rule: This project runs on Windows with PowerShell terminal. All local commands MUST use valid PowerShell syntax to avoid command failures.

# AGENTS.md

This file defines mandatory rules and operating constraints for any AI agent
(Codex, GPT, automation tools) contributing to this repository.

The architecture of this project is FINAL and must not be altered.

---

# 1. PROJECT PHILOSOPHY

This project is:

- Static-first
- Content-driven
- Editorial-focused
- Performance-first
- Backend-free

Core principle:

Content is code.

All blog posts are MDX files stored in the repository.

---

# 2. ABSOLUTE CONSTRAINTS (DO NOT VIOLATE)

AI agents MUST NOT introduce:

- Backend APIs
- Databases
- Server runtime logic
- Authentication systems
- CMS dashboards
- Admin panels
- External content APIs
- SSR frameworks or server rendering
- Full-stack frameworks

If a feature appears to require backend logic:

-> propose a STATIC alternative.

---

# 3. TECHNOLOGY STACK (LOCKED)

Framework:

- Astro (static output)

Styling:

- Tailwind CSS v4
- CSS design tokens

Content:

- Astro Content Collections
- MDX files

Search:

- Pagefind (static index)

SEO:

- JSON-LD schema generated at build time

Deployment target:

- Static hosting via CDN (Vercel)

---

# 4. STATIC-FIRST RULE

All dynamic behavior must be:

- precomputed at build time OR
- client-side enhancement only when strictly necessary.

Examples:

GOOD:

- reading time computed during build
- related posts computed during build
- OG images generated during build

BAD:

- server API for content
- runtime database queries
- dynamic content fetching

---

# 5. DESIGN SYSTEM RULES

Brand identity:

- Lavender accent color
- Editorial typography
- Geometric diamond motif

Visual style:

- Editorial
- Academic
- Minimal motion

DO NOT introduce:

- flashy gradients
- heavy animation frameworks
- UI libraries without approval.

---

# 6. PERFORMANCE PRIORITY

Agents must:

- minimize JavaScript
- avoid unnecessary hydration
- prefer CSS over JS
- avoid large dependencies.

---

# 7. COMPONENT DESIGN GUIDELINES

Components must:

- be small and composable
- follow editorial layout system
- avoid state-heavy patterns.

Examples:

Allowed:

- TableOfContents
- ReadingProgress
- ShareButtons

Not allowed:

- interactive dashboards
- user accounts
- real-time features.

---

# 8. SEO AUTOMATION

SEO must be implemented via:

- static metadata generation
- structured data (JSON-LD)
- sitemap + RSS
- internal linking logic.

Agents should never introduce SEO plugins requiring backend.

---

# 9. DARK MODE

Dark mode must:

- use CSS variables
- avoid heavy JS frameworks.

---

# 10. FILE STRUCTURE

Agents must respect existing folder structure.

Do not reorganize directories without explicit instruction.

---

# 11. WHEN UNSURE

If implementation options include:

A) static solution
B) dynamic/backend solution

Always choose:

-> static solution.

---

# 12. NON-GOALS

This project is NOT:

- a blogging platform
- a CMS
- a SaaS application
- a user-facing web app

It is:

-> a high-performance editorial website.

---

# FINAL RULE

Architecture is final.

Agents must extend within constraints, not redesign them.
