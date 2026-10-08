import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { updateUser } from '../../app/store/authSlice';
import { userApi } from '../../services/api/userApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { formatDate } from '../../utils/helpers';
import { User, Mail, Shield, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

const profileSchema = zod.object({
  name: zod.string().min(1, 'Full name is required').max(100),
  email: zod.string().min(1, 'Email is required').email('Invalid email address'),
});

type ProfileFormValues = zod.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    setSuccess(false);
    setApiError(null);

    try {
      const updated = await userApi.updateMe({
        name: values.name,
        email: values.email,
      });

      dispatch(updateUser(updated));
      setSuccess(true);
      
      // Auto dismiss success notice
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setApiError(err.response?.data?.detail || 'Profile update failed. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left animate-fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
          Account Profile
        </h1>
        <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
          Manage your personal identifiers, contact email, and workspace roles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Summary Avatar Widget */}
        <Card className="md:col-span-1">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/60 flex items-center justify-center font-bold text-3xl text-primary-700 dark:text-primary-300 uppercase shadow-md select-none">
              {user.name.charAt(0)}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-base font-bold text-dark-900 dark:text-white leading-snug">
                {user.name}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/20 uppercase tracking-wide">
                <Shield className="w-3 h-3" />
                <span>{user.role}</span>
              </span>
            </div>

            {/* Meta details list */}
            <div className="w-full pt-6 border-t border-dark-100 dark:border-dark-800 space-y-3 text-xs text-left">
              <div className="flex items-center gap-2.5 text-dark-500 dark:text-dark-400">
                <Mail className="w-4 h-4 text-dark-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-dark-500 dark:text-dark-400">
                <Calendar className="w-4 h-4 text-dark-400 shrink-0" />
                <span>Member since {formatDate(user.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Edit Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Update your default name and communications email.</CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-4 p-3.5 bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 rounded-2xl text-xs font-semibold text-primary-600 dark:text-primary-400 flex gap-2 items-center">
                <CheckCircle2 className="w-4 h-4 text-primary-500" />
                <span>Profile details updated successfully.</span>
              </div>
            )}

            {apiError && (
              <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-semibold text-danger">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                error={errors.name?.message}
                leftIcon={<User className="w-4.5 h-4.5 text-dark-400" />}
                {...register('name')}
                disabled={isSubmitting}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="jane@company.com"
                error={errors.email?.message}
                leftIcon={<Mail className="w-4.5 h-4.5 text-dark-400" />}
                {...register('email')}
                disabled={isSubmitting}
              />

              <div className="flex justify-end pt-4 border-t border-dark-100 dark:border-dark-800 select-none">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-6 h-10.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ProfilePage;
