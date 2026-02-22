// Central place to control backend base URL.
// - Local dev: set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
// - Vercel: set NEXT_PUBLIC_API_BASE_URL=https://YOUR_RENDER_URL
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function apiUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}