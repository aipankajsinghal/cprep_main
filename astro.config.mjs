// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://www.championsprep.in",
  output: "static",
  trailingSlash: "always",
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeSlug, rehypeKatex]
    }),
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
