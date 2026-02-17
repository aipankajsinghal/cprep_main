import { defineCollection, z } from "astro:content";
import { CLUSTERS } from "../utils/clusters";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    publishDate: z.date().optional(),
    updatedDate: z.date().optional(),
    author: z.string().default("ChampionsPrep"),
    tags: z.array(z.string()),
    cluster: z.enum(CLUSTERS),
    draft: z.boolean().optional(),
    minutesRead: z.number().optional(),
    ogImage: z.string().optional(),
    faqItems: z
      .array(
        z.object({
          q: z.string(),
          a: z.string()
        })
      )
      .optional()
    ,
    // InlineQuiz frontmatter schema (v1)
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
      .optional()
  })
});

export const collections = { blog };
