'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'

type LoginStep = 'credentials' | 'mfa'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('credentials')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Credentials state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (!result?.ok) {
        setError(result?.error || 'Failed to sign in')
        setLoading(false)
        return
      }

      // Check if MFA is required
      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()

      if (session?.requiresMFA) {
        setStep('mfa')
        setLoading(false)
      } else {
        // Redirect to dashboard
        router.push('/admin/dashboard')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        totp,
        redirect: false,
      })

      if (!result?.ok) {
        setError('Invalid TOTP code')
        setLoading(false)
        return
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        {/* Logo section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg mb-4">
            <span className="text-2xl sm:text-3xl font-bold text-white">LS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Little Smarties
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Admin Dashboard
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 py-8 sm:py-10 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {step === 'credentials' ? 'Sign In' : 'Verify Code'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1">
              {step === 'credentials'
                ? 'Enter your credentials to access the admin panel'
                : 'Enter the code from your authenticator app'}
            </p>
          </div>

          {/* Form content */}
          <div className="px-6 sm:px-8 py-8 sm:py-10">
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Credentials form */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5 sm:space-y-6">
                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@littlesmarties.ae"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>

                {/* Password field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3 sm:py-3.5 font-semibold text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}

            {/* MFA form */}
            {step === 'mfa' && (
              <form onSubmit={handleMFASubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <label
                    htmlFor="totp"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Authenticator Code
                  </label>
                  <input
                    id="totp"
                    type="text"
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 text-center text-2xl font-mono letter-spacing-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-2">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || totp.length !== 6}
                  className="w-full py-3 sm:py-3.5 font-semibold text-base sm:text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-full text-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors"
                >
                  Back to login
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 sm:py-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
            <p className="text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              Demo Credentials:<br />
              Email: <span className="font-mono text-gray-900 dark:text-gray-200">admin@lsn.ae</span><br />
              Password: <span className="font-mono text-gray-900 dark:text-gray-200">AdminSecret123!</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
            © 2026 Little Smarties Nursery. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
