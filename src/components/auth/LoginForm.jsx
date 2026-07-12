'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle } from 'lucide-react';
import { loginSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();

  // Field input states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Action status states
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync field value changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user modifies the input field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Clear API error banner when user begins correcting the form
    if (apiError) {
      setApiError('');
    }
  };

  // Submit login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setValidationErrors({});

    // 1. Zod input validation check
    const validation = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });

    const newErrors = {};

    if (!validation.success) {
      const formatted = validation.error.format();
      if (formatted.email) newErrors.email = formatted.email._errors[0];
      if (formatted.password) newErrors.password = formatted.password._errors[0];
    }

    // 2. Stop submission if validation errors are found
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 3. Perform NextAuth credentials sign-in
      const result = await signIn('credentials', {
        email: validation.data.email,
        password: validation.data.password,
        redirect: false,
      });
      console.log(result);

      // Assert successful authentication result
      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          throw new Error("Invalid email or password");
        }

        throw new Error("Authentication failed");
      }

      // 4. Route to dashboard and force a refresh to sync active session
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your NIVO creator account
        </p>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/15 border border-destructive/30 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            autoComplete="email"
            disabled={isLoading}
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {validationErrors.email && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              {validationErrors.email}
            </p>
          )}
        </div>

        {/* Password input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            value={formData.password}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {validationErrors.password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              {validationErrors.password}
            </p>
          )}
        </div>

        {/* Submit action */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 gradient-primary text-white font-semibold flex justify-center items-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Redirect footer */}
      <p className="text-center text-xs text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
