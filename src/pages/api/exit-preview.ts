import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ redirect, cookies }) => {
  // Clear the preview cookie
  cookies.delete('sanity-preview', {
    path: '/',
  });

  // Redirect back to the homepage
  return redirect('/');
};
