'use server'

import { redirect } from 'next/navigation'
import { isEmail, safeNextPath } from '@/lib/core/safe-redirect'
import { siteUrl } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'
import type { AuthState } from '@/lib/types'

const text = (data: FormData, key: string) => String(data.get(key) ?? '').trim()

export async function signInWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = text(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(text(formData, 'next'))
  if (!isEmail(email) || password.length === 0) return { error: 'Enter your email and password.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  // One message for every failure, so the form cannot be used to discover which emails have accounts.
  if (error) return { error: 'That email and password do not match. Check them and try again.' }
  redirect(next)
}

export async function signUpWithPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = text(formData, 'email').toLowerCase()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(text(formData, 'next'))
  if (!isEmail(email)) return { error: 'Enter a valid email address.' }
  if (password.length < 8) return { error: 'Choose a password with at least 8 characters.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error) return { error: 'We could not create that account. If you already have one, sign in instead.' }
  if (data.session) redirect(next) // email confirmation is switched off in Supabase
  return { message: 'Check your inbox for a confirmation link, then come back and sign in.' }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const next = safeNextPath(text(formData, 'next'))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  })
  if (error || !data.url) redirect('/login?error=oauth')
  redirect(data.url)
}

export async function sendPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = text(formData, 'email').toLowerCase()
  if (!isEmail(email)) return { error: 'Enter the email address you signed up with.' }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=/settings` })
  // Same answer whether or not the account exists.
  return { message: 'If that email has an account, a reset link is on its way.' }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
