import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context: { site: URL | undefined }) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  return rss({
    title: "ChampionsPrep Blog",
    description: "Editorial posts and exam-prep insights from ChampionsPrep.",
    site: context.site ?? new URL("https://www.championsprep.in"),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`
    }))
  });
}
