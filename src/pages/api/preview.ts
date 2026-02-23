import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const slug = url.searchParams.get('slug');

  // Basic secret validation if configured
  const previewSecret = import.meta.env.SANITY_PREVIEW_SECRET;
  if (previewSecret && secret !== previewSecret) {
    return new Response('Invalid secret', { status: 401 });
  }

  // Enable preview mode by setting a cookie
  cookies.set('sanity-preview', 'true', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  });

  // Redirect to the post page or homepage
  if (slug) {
    return redirect(`/blog/${slug}`);
  }

  return redirect('/');
};
