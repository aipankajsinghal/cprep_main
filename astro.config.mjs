// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";

export default defineConfig({
  site: "https://www.championsprep.in/blog",
  output: "static",
  integrations: [
    mdx({
      rehypePlugins: [rehypeSlug]
    }),
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
