'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { registerSchema } from '@/lib/validations/auth';

export function RegisterForm() {
  const router = useRouter();
  
  // Field input states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Action status states
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Submit registration handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setValidationErrors({});

    // 1. Zod input validation check
    const validation = registerSchema.safeParse({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    const newErrors = {};

    if (!validation.success) {
      const formatted = validation.error.format();
      if (formatted.name) newErrors.name = formatted.name._errors[0];
      if (formatted.email) newErrors.email = formatted.email._errors[0];
      if (formatted.password) newErrors.password = formatted.password._errors[0];
    }

    // 2. Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // 3. Stop submission if validation errors are found
    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 4. Send API POST request using validated Zod outputs
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: validation.data.name,
          email: validation.data.email,
          password: validation.data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed. Please try again.');
      }

      setIsSuccess(true);
      
      // 5. Short redirect buffer on success (2 seconds)
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = 'w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-violet-500/20 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.06)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-4">
      {/* API Success Banner */}
      {isSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5 text-[13px] text-emerald-400/90">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400/70" />
          <span>Access created. Entering NIVO...</span>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3.5 text-[13px] text-rose-400/90">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400/70" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-name" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="name"
            disabled={isLoading || isSuccess}
            value={formData.name}
            onChange={handleInputChange}
            className={inputClasses}
          />
          {validationErrors.name && (
            <p className="text-[11px] text-rose-400/80">{validationErrors.name}</p>
          )}
        </div>

        {/* Email input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-email" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading || isSuccess}
            value={formData.email}
            onChange={handleInputChange}
            className={inputClasses}
          />
          {validationErrors.email && (
            <p className="text-[11px] text-rose-400/80">{validationErrors.email}</p>
          )}
        </div>

        {/* Password input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-password" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading || isSuccess}
              value={formData.password}
              onChange={handleInputChange}
              className={`${inputClasses} pr-11`}
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

        {/* Confirm password input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-confirmPassword" className="text-[9px] font-medium tracking-[0.2em] text-white/40 uppercase">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="register-confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading || isSuccess}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`${inputClasses} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-colors duration-200 cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-[11px] text-rose-400/80">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit action */}
        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full h-11 mt-1 nivo-glass-light rounded-xl text-[11px] font-semibold tracking-[0.18em] text-white/80 uppercase transition-all duration-300 ease-out hover:text-white hover:border-white/15 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] motion-safe:hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 cursor-pointer flex items-center justify-center gap-2.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating Access...</span>
            </>
          ) : (
            'Create Access'
          )}
        </button>
      </form>
    </div>
  );
}
