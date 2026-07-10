'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to set up your creator studio
        </p>
      </div>

      {/* API Success Banner */}
      {isSuccess && (
        <div className="flex items-center gap-3 rounded-lg bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>Account created successfully! Redirecting to login...</span>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/15 border border-destructive/30 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            disabled={isLoading || isSuccess}
            value={formData.name}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {validationErrors.name && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              {validationErrors.name}
            </p>
          )}
        </div>

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
            disabled={isLoading || isSuccess}
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
            autoComplete="new-password"
            disabled={isLoading || isSuccess}
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

        {/* Confirm password input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading || isSuccess}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {validationErrors.confirmPassword && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-0.5">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit action */}
        <Button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full h-10 gradient-primary text-white font-semibold flex justify-center items-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Redirect footer */}
      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}
