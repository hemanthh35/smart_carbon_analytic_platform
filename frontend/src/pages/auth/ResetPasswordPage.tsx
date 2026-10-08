import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Lock, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

const resetPasswordSchema = zod
  .object({
    password: zod.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = zod.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    // Simulate reset delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsReset(true);
  };

  if (isReset) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="space-y-6 p-0 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-primary-50 dark:bg-primary-950/20 rounded-full text-primary-500 shadow-md">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-dark-900 dark:text-white">
              Password Reset Complete
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 max-w-sm mx-auto">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
          </div>
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary-500/10"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-dark-900 dark:text-white">
          Reset Password
        </h2>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Enter your new password below to secure your PulseCarbon account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
          {...register('password')}
          disabled={isSubmitting}
        />

        <Input
          label="Confirm New Password"
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
              <span>Updating password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </Button>
      </form>
    </div>
  );
};
export default ResetPasswordPage;
