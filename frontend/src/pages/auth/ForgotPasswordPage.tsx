import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

const forgotPasswordSchema = zod.object({
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = zod.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSent(true);
  };

  if (isSent) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="space-y-6 p-0 text-center">
          <div className="flex justify-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full text-emerald-500 shadow-md">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-dark-900 dark:text-white">
              Check your email
            </h2>
            <p className="text-sm text-dark-500 dark:text-dark-400 max-w-sm mx-auto">
              We have sent a password reset link to your email address. Please follow the instructions to secure your account.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to login</span>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5 text-center lg:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-dark-900 dark:text-white">
          Forgot Password
        </h2>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          leftIcon={<Mail className="w-4.5 h-4.5 text-dark-400" />}
          {...register('email')}
          disabled={isSubmitting}
        />

        {/* Action Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>Sending link...</span>
            </>
          ) : (
            <span>Send Reset Link</span>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center text-xs text-dark-500 dark:text-dark-400 select-none">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to login</span>
        </Link>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
