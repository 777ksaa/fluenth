'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isLevel } from '@/lib/core/levels'
import { isSupportedLang } from '@/lib/core/languages'
import { getSessionContext } from '@/lib/supabase/server'
import type { AuthState } from '@/lib/types'

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export async function updateProfile(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const displayName = String(formData.get('display_name') ?? '').trim().slice(0, 80)
  const nativeLang = String(formData.get('native_lang') ?? '')
  const level = String(formData.get('cefr_level') ?? '')
  const goal = Number.parseInt(String(formData.get('daily_goal_xp') ?? ''), 10)
  const timezone = String(formData.get('timezone') ?? '')

  if (!isSupportedLang(nativeLang)) return { error: 'Choose one of the listed languages.' }
  if (!isLevel(level)) return { error: 'Choose a level from A1 to C2.' }
  if (!Number.isInteger(goal) || goal < 5 || goal > 500) return { error: 'Set a daily goal between 5 and 500 XP.' }
  if (!isTimeZone(timezone)) return { error: 'That time zone is not recognised.' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { error: 'Sign in again to save your settings.' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName || null, native_lang: nativeLang, cefr_level: level, daily_goal_xp: goal, timezone })
    .eq('id', userId)
  if (error) return { error: 'Your settings could not be saved. Try again.' }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { message: 'Settings saved.' }
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (password.length < 8) return { error: 'Choose a password with at least 8 characters.' }
  if (password !== confirm) return { error: 'The two passwords do not match.' }

  const { supabase, userId } = await getSessionContext()
  if (!userId) return { error: 'Sign in again to change your password.' }
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'The password could not be changed. Try signing in again first.' }
  return { message: 'Password changed.' }
}

/** Permanently erases the account and all learning data (cascades from auth.users). */
export async function deleteAccount(formData: FormData): Promise<void> {
  if (String(formData.get('confirm') ?? '').trim().toLowerCase() !== 'delete') redirect('/settings?error=confirm')

  const { supabase, userId } = await getSessionContext()
  if (!userId) redirect('/login?next=/settings')

  const { error } = await supabase.rpc('delete_account')
  if (error) redirect('/settings?error=delete')
  await supabase.auth.signOut()
  redirect('/?deleted=1')
}
