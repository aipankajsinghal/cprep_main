import rss from "@astrojs/rss";
import { sanityClient } from "../lib/sanity";
import { ALL_POSTS_QUERY } from "../lib/queries";

export async function GET(context: { site: URL | undefined }) {
  const now = new Date();
  const rawPosts = await sanityClient.fetch(ALL_POSTS_QUERY);

  const posts = rawPosts
    .filter((p: any) => !p.publishDate || new Date(p.publishDate) <= now)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return rss({
    title: "ChampionsPrep Blog",
    description: "Editorial posts and exam-prep insights from ChampionsPrep.",
    site: context.site ?? new URL("https://www.championsprep.in"),
    items: posts.map((post: any) => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(post.date),
      link: `/blog/${post.slug}/`
    }))
  });
}
