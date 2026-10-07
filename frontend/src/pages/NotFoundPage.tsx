import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in duration-300">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-5 bg-primary-100 dark:bg-primary-950/20 text-primary-500 rounded-full shadow-lg">
            <HelpCircle className="w-16 h-16 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black text-dark-900 dark:text-white tracking-tight">404</h1>
          <h2 className="text-2xl font-bold text-dark-800 dark:text-dark-200">Page Not Found</h2>
          <p className="text-sm text-dark-450 dark:text-dark-400">
            The page path you requested does not exist or has been relocated to another workspace area.
          </p>
        </div>

        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-1.5 h-11 shadow-lg shadow-primary-500/10"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
    </div>
  );
};
export default NotFoundPage;
