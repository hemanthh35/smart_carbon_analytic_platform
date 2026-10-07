import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../app/store/store';
import { toggleTheme } from '../../app/store/uiSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, Bell, Moon, Sun, Lock, Loader2, CheckCircle2, Clock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: RootState) => state.ui);
  
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [modelAlerts, setModelAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60'); // Minutes
  
  // Password form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    try {
      setPwdLoading(true);
      // Simulate API change
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPwdSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwdError('Failed to change password. Please verify current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left animate-fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-dark-900 dark:text-white leading-none">
          Portal Settings
        </h1>
        <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">
          Adjust accessibility defaults, secure credentials, and alert routes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Navigation Quick Links */}
        <div className="space-y-3 md:col-span-1 select-none">
          <Card className="p-3 bg-dark-50/50 dark:bg-dark-900/30 border border-dark-200/40 dark:border-dark-800/40">
            <CardContent className="p-0 space-y-1">
              <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-dark-800 text-dark-900 dark:text-white shadow-sm border border-dark-200/50 dark:border-dark-700/60">
                General Preferences
              </button>
              <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-dark-550 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-850">
                Security & Verification
              </button>
              <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-dark-550 hover:bg-dark-50 dark:text-dark-400 dark:hover:bg-dark-850">
                API Tokens & Webhooks
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings Sections */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Section 1: Appearance & Themes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-400 rounded-lg">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <CardTitle className="text-base">Appearance & Interface</CardTitle>
              </div>
              <CardDescription>Configure layout themes and dark mode filters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800 select-none">
                <div>
                  <span className="block text-xs font-bold text-dark-800 dark:text-dark-200">Layout Mode</span>
                  <span className="block text-[10px] text-dark-450 dark:text-dark-500">Toggle dark or light theme interface</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(toggleTheme())}
                  className="flex items-center gap-1.5"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-transparent dark:border-transparent select-none">
                <div>
                  <span className="block text-xs font-bold text-dark-800 dark:text-dark-200">Idle Session Limit</span>
                  <span className="block text-[10px] text-dark-455 dark:text-dark-500">Set automatic logout window after inactivity</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-4 h-4 text-dark-400" />
                  <select
                    value={sessionTimeout}
                    onChange={(e) => setSessionTimeout(e.target.value)}
                    className="h-8 rounded-lg bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 text-xs px-2 focus:ring-1 focus:ring-primary-500 outline-none"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Alert Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-400 rounded-lg">
                  <Bell className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">System Notifications</CardTitle>
              </div>
              <CardDescription>Determine alert channels for reports and forecasts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-800 select-none">
                <div>
                  <span className="block text-xs font-bold text-dark-800 dark:text-dark-200">Email Updates</span>
                  <span className="block text-[10px] text-dark-450 dark:text-dark-500">Receive compliance report copies via inbox</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-dark-800 peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-transparent dark:border-transparent select-none">
                <div>
                  <span className="block text-xs font-bold text-dark-800 dark:text-dark-200">Forecast alerts</span>
                  <span className="block text-[10px] text-dark-455 dark:text-dark-500">Send logs notifications when BiLSTM computes high outputs</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelAlerts}
                    onChange={(e) => setModelAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-dark-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-dark-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-dark-800 peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Credentials Change */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-400 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">Credential Security</CardTitle>
              </div>
              <CardDescription>Update your portal access keys and passwords.</CardDescription>
            </CardHeader>
            <CardContent>
              {pwdSuccess && (
                <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-xs font-semibold text-emerald-600 dark:text-emerald-450 flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Password updated successfully. Remember it for next session.</span>
                </div>
              )}

              {pwdError && (
                <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-xs font-semibold text-danger">
                  {pwdError}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
                  disabled={pwdLoading}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
                    disabled={pwdLoading}
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="w-4.5 h-4.5 text-dark-400" />}
                    disabled={pwdLoading}
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-dark-100 dark:border-dark-800 select-none">
                  <Button type="submit" disabled={pwdLoading} className="w-full sm:w-auto px-6 h-10 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {pwdLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating credentials...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
