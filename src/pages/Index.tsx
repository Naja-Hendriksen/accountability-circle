import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import Landing from './Landing';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page for non-authenticated users, redirect to dashboard for authenticated users
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

export default Index;
