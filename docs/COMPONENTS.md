# Components

## Core Editorial Components

- `Breadcrumbs.astro`
  - Breadcrumb navigation (`Blog > Post`)
- `TableOfContents.astro`
  - H2/H3 navigation for post structure
- `ReadingProgress.astro`
  - Top progress indicator
- `PrevNextNav.astro`
  - Adjacent posts within cluster
- `RelatedPosts.astro`
  - Cluster/tag scored recommendations
- `AuthorCard.astro`
  - Author attribution block

## Engagement Components

- `ShareButtons.astro`
  - Share actions + GA events
- `MicroFeedback.astro`
  - Helpful/not-helpful event capture
- `SignupCTA.astro`
  - Conversion CTA with GA click event
- `SmartCTA.astro`
  - Mid and end contextual conversion blocks

## Learning Components

- `ExamTip.astro`
  - Editorial callout block
- `StudyTool.astro`
  - Modes:
    - `revision`
    - `mistakes`
    - `check-understanding`
- `InlineAssistant.astro`
  - Stateless contextual AI help
  - Hybrid response strategy:
    - cache
    - static response
    - optional runtime enhancement

## Search Component

- `SearchWidget.astro`
  - Pagefind UI mount on blog index

## Layout

- `BlogLayout.astro`
  - Metadata, global styles, theme init, GA base context, manifest link, service worker registration

## Interaction Notes

- Use minimal vanilla JS for interactions.
- Avoid whole-page hydration patterns.
- Keep each component self-contained and composable.
