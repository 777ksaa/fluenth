// Reads the public Supabase settings. NEXT_PUBLIC_* values must be referenced literally
// (not via destructuring or a dynamic key) so Next.js can inline them into browser bundles.

export function supabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill them in.',
    )
  }
  return { url, key }
}
