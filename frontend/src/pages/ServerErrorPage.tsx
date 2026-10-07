import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in duration-300">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="p-5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full shadow-lg">
            <AlertCircle className="w-16 h-16" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black text-dark-900 dark:text-white tracking-tight">500</h1>
          <h2 className="text-2xl font-bold text-dark-800 dark:text-dark-200">Server Interrupted</h2>
          <p className="text-sm text-dark-450 dark:text-dark-400">
            An unexpected error occurred in our deep-learning backends. We are checking the BiLSTM GPU registers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-1.5 h-11"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Connection</span>
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-1.5 h-11"
          >
            <Home className="w-4 h-4" />
            <span>Go Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ServerErrorPage;
