import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default("ChampionsPrep"),
    tags: z.array(z.string()),
    cluster: z.string(),
    draft: z.boolean().optional(),
    minutesRead: z.number().optional(),
    ogImage: z.string().optional(),
    faq: z.boolean().default(false)
  })
});

export const collections = { blog };
