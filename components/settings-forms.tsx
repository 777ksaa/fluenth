'use client'

import { useActionState, useEffect, useState } from 'react'
import { deleteAccount, updatePassword, updateProfile } from '@/lib/actions/account'
import { signOut } from '@/lib/actions/auth'
import { LANG_NAMES } from '@/lib/core/languages'
import { LEVEL_INFO, LEVELS } from '@/lib/core/levels'
import type { AuthState, ProfileSummary } from '@/lib/types'

interface Props {
  profile: ProfileSummary
  email: string | null
  /** Message from a failed account deletion (?error=confirm or ?error=delete). */
  notice?: string
}

export function SettingsForms({ profile, email, notice }: Props) {
  const [profileState, profileAction, saving] = useActionState<AuthState, FormData>(updateProfile, {})
  const [passwordState, passwordAction, changing] = useActionState<AuthState, FormData>(updatePassword, {})

  // Controlled values: React resets uncontrolled fields after an action finishes, which would
  // flash the old values back in after saving.
  const [name, setName] = useState(profile.display_name ?? '')
  const [lang, setLang] = useState(profile.native_lang)
  const [level, setLevel] = useState(profile.cefr_level)
  const [goal, setGoal] = useState(String(profile.daily_goal_xp))
  const [zone, setZone] = useState(profile.timezone)
  const [zones, setZones] = useState<string[]>([])

  // The list of time zones differs between server and browser, so it is read after hydration.
  useEffect(() => {
    try {
      setZones(Intl.supportedValuesOf('timeZone'))
    } catch {
      setZones([])
    }
  }, [])

  return (
    <div className="space-y-16">
      <section aria-labelledby="learning-heading">
        <h2 id="learning-heading" className="title-md">
          Your learning
        </h2>
        <form action={profileAction} className="mt-4 max-w-lg space-y-4">
          <div>
            <label htmlFor="s-name" className="label">
              Name
            </label>
            <input
              id="s-name"
              name="display_name"
              type="text"
              maxLength={80}
              autoComplete="name"
              value={name}
              onChange={(e: { target: { value: string } }) => setName(e.target.value)}
              className="field w-full"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-lang" className="label">
                Your language
              </label>
              <select id="s-lang" name="native_lang" value={lang} onChange={(e: { target: { value: string } }) => setLang(e.target.value)} className="field w-full">
                {Object.entries(LANG_NAMES).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="s-level" className="label">
                Your English level
              </label>
              <select id="s-level" name="cefr_level" value={level} onChange={(e: { target: { value: string } }) => setLevel(e.target.value)} className="field w-full">
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}, {LEVEL_INFO[l].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-goal" className="label">
                Daily goal in XP
              </label>
              <input
                id="s-goal"
                name="daily_goal_xp"
                type="number"
                min={5}
                max={500}
                step={5}
                inputMode="numeric"
                value={goal}
                onChange={(e: { target: { value: string } }) => setGoal(e.target.value)}
                className="field w-full"
                aria-describedby="s-goal-hint"
              />
              <p id="s-goal-hint" className="hint mt-1">
                About 50 XP is ten minutes of practice.
              </p>
            </div>
            <div>
              <label htmlFor="s-zone" className="label">
                Time zone
              </label>
              <input
                id="s-zone"
                name="timezone"
                type="text"
                list="s-zones"
                autoComplete="off"
                value={zone}
                onChange={(e: { target: { value: string } }) => setZone(e.target.value)}
                className="field w-full"
                aria-describedby="s-zone-hint"
              />
              <datalist id="s-zones">
                {zones.map((z) => (
                  <option key={z} value={z} />
                ))}
              </datalist>
              <p id="s-zone-hint" className="hint mt-1">
                Your streak rolls over at midnight here.{' '}
                <button
                  type="button"
                  className="text-pen underline underline-offset-2"
                  onClick={() => setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
                >
                  Use this device’s time zone
                </button>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {profileState.message ? (
              <p role="status" className="text-sm text-ok">
                {profileState.message}
              </p>
            ) : null}
            {profileState.error ? (
              <p role="alert" className="text-sm text-redpen">
                {profileState.error}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section aria-labelledby="account-heading">
        <h2 id="account-heading" className="title-md">
          Account
        </h2>
        {email ? <p className="muted mt-2">Signed in as {email}</p> : null}
        <form action={passwordAction} className="mt-6 max-w-lg space-y-4">
          <h3 className="title-sm">Change your password</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="s-password" className="label">
                New password
              </label>
              <input id="s-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="field w-full" />
            </div>
            <div>
              <label htmlFor="s-confirm" className="label">
                Repeat it
              </label>
              <input id="s-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field w-full" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-quiet" disabled={changing}>
              {changing ? 'Changing…' : 'Change password'}
            </button>
            {passwordState.message ? (
              <p role="status" className="text-sm text-ok">
                {passwordState.message}
              </p>
            ) : null}
            {passwordState.error ? (
              <p role="alert" className="text-sm text-redpen">
                {passwordState.error}
              </p>
            ) : null}
          </div>
        </form>

        <form action={signOut} className="mt-8">
          <button type="submit" className="btn btn-quiet">
            Sign out
          </button>
        </form>
      </section>

      <section aria-labelledby="delete-heading">
        <h2 id="delete-heading" className="title-md">
          Delete your account
        </h2>
        <p className="muted measure mt-2">
          This removes your profile, saved words, progress and history for good. It cannot be undone. Export your words first if you
          want to keep them.
        </p>
        <form action={deleteAccount} className="mt-4 max-w-lg space-y-3">
          <div>
            <label htmlFor="s-delete" className="label">
              Type “delete” to confirm
            </label>
            <input id="s-delete" name="confirm" type="text" autoComplete="off" required className="field w-full" />
          </div>
          <button type="submit" className="btn btn-danger">
            Delete my account
          </button>
          {notice ? (
            <p role="alert" className="text-sm text-redpen">
              {notice}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  )
}
