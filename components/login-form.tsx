'use client'

import { useActionState, useState } from 'react'
import { sendPasswordReset, signInWithGoogle, signInWithPassword, signUpWithPassword } from '@/lib/actions/auth'
import type { AuthState } from '@/lib/types'

type Mode = 'signin' | 'signup' | 'reset'

const SUBMIT: Record<Mode, { idle: string; busy: string }> = {
  signin: { idle: 'Sign in', busy: 'Signing in…' },
  signup: { idle: 'Create account', busy: 'Creating your account…' },
  reset: { idle: 'Send reset link', busy: 'Sending…' },
}

const linkButton = 'text-pen underline underline-offset-2'

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('') // controlled, so a failed attempt does not wipe it (React resets uncontrolled fields after an action)
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signInWithPassword, {})
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUpWithPassword, {})
  const [resetState, resetAction, resetting] = useActionState<AuthState, FormData>(sendPasswordReset, {})

  const state = mode === 'signin' ? signInState : mode === 'signup' ? signUpState : resetState
  const action = mode === 'signin' ? signInAction : mode === 'signup' ? signUpAction : resetAction
  const pending = mode === 'signin' ? signingIn : mode === 'signup' ? signingUp : resetting

  return (
    <div className="space-y-6">
      {notice ? (
        <p role="alert" className="panel text-sm">
          {notice}
        </p>
      ) : null}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className="btn btn-quiet w-full">
          Continue with Google
        </button>
      </form>

      <p className="hint text-center">or use your email</p>

      <form key={mode} action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e: { target: { value: string } }) => setEmail(e.target.value)}
            className="field w-full"
          />
        </div>

        {mode !== 'reset' ? (
          <div>
            <label htmlFor="login-password" className="label">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="field w-full"
              aria-describedby={mode === 'signup' ? 'login-password-hint' : undefined}
            />
            {mode === 'signup' ? (
              <p id="login-password-hint" className="hint mt-1">
                At least 8 characters.
              </p>
            ) : null}
          </div>
        ) : null}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? SUBMIT[mode].busy : SUBMIT[mode].idle}
        </button>

        {state.error ? (
          <p role="alert" className="text-sm text-redpen">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="text-sm text-ok">
            {state.message}
          </p>
        ) : null}
      </form>

      <div className="space-y-2 text-sm">
        {mode === 'signin' ? (
          <>
            <p>
              <button type="button" className={linkButton} onClick={() => setMode('reset')}>
                Forgot your password?
              </button>
            </p>
            <p>
              No account yet?{' '}
              <button type="button" className={linkButton} onClick={() => setMode('signup')}>
                Create one
              </button>
            </p>
          </>
        ) : (
          <p>
            {mode === 'signup' ? 'Already have an account? ' : ''}
            <button type="button" className={linkButton} onClick={() => setMode('signin')}>
              {mode === 'signup' ? 'Sign in' : 'Back to sign in'}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
