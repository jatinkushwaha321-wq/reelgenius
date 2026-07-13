'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { loginSchema } from '@/lib/validations/auth';

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex flex-col gap-5">
      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3.5 text-[13px] text-rose-400/90">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400/70" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Email input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-violet-500/20 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.06)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {validationErrors.email && (
            <p className="text-[11px] text-rose-400/80">{validationErrors.email}</p>
          )}
        </div>

        {/* Password input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              value={formData.password}
              onChange={handleInputChange}
              className="w-full h-12 px-4 pr-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-violet-500/20 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.06)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors duration-200 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-[11px] text-rose-400/80">{validationErrors.password}</p>
          )}
        </div>

        {/* Submit action */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-1 nivo-glass-light rounded-xl text-[11px] font-semibold tracking-[0.18em] text-white/80 uppercase transition-all duration-300 ease-out hover:text-white hover:border-white/15 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] motion-safe:hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 cursor-pointer flex items-center justify-center gap-2.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Entering NIVO...</span>
            </>
          ) : (
            'Enter NIVO'
          )}
        </button>
      </form>
    </div>
  );
}
