// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  site: "https://www.championsprep.in",
  // Astro 5 requires 'server' (or the old 'hybrid') output to build serverless functions.
  // With 'server', pages are SSR by default, but we can prerender them, OR
  // Vercel Edge caching will handle them if we set Cache-Control headers.
  output: "server",
  adapter: vercel(),
  trailingSlash: "always",
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeSlug, rehypeKatex]
    }),
    sitemap({
      filter: (page) => !page.includes("/api/"),
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
