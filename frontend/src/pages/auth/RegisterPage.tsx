import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { setCredentials, setError } from '../../app/store/authSlice';
import { authApi } from '../../services/api/authApi';
import { userApi } from '../../services/api/userApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const registerSchema = zod
  .object({
    name: zod.string().min(1, 'Full name is required').max(100, 'Name is too long'),
    email: zod.string().min(1, 'Email is required').email('Invalid email address'),
    password: zod.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormValues = zod.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    dispatch(setError(null));

    try {
      // Step 1: Register (which returns tokens)
      const tokens = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // Save tokens temporarily to allow getMe call to succeed
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);

      // Step 2: Fetch current user profile
      const user = await userApi.getMe();

      // Step 3: Commit to Redux
      dispatch(
        setCredentials({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        })
      );

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      // Clean up local storage if anything fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      const errMsg = err.response?.data?.detail || 'Registration failed. Email may already be in use.';
      setApiError(errMsg);
      dispatch(setError(errMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-dark-900 dark:text-white">
          Create an account
        </h2>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Get started with PulseCarbon AI forecasting platform
        </p>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-semibold text-danger animate-in fade-in slide-in-from-top-2 duration-150">
          {apiError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          error={errors.name?.message}
          leftIcon={<User className="w-4.5 h-4.5 text-dark-400" />}
          {...register('name')}
          disabled={isSubmitting}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4.5 h-4.5 text-dark-400" />}
          {...register('email')}
          disabled={isSubmitting}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            error={errors.password?.message}
            leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none hover:text-dark-900 text-dark-400 dark:text-dark-500 p-0.5 rounded transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            }
            {...register('password')}
            disabled={isSubmitting}
          />
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
          {...register('confirmPassword')}
          disabled={isSubmitting}
        />

        {/* Action Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl shadow-lg mt-4 flex justify-center items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center text-xs text-dark-500 dark:text-dark-400 select-none">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};
export default RegisterPage;
