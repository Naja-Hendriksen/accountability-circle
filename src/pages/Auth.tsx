import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!name.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your name to create an account.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) throw error;
        toast({
          title: "Welcome to Bloom!",
          description: "Your account has been created successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8">
            <Leaf className="h-10 w-10 text-primary" />
          </div>
          <h1 className="heading-display text-foreground mb-6">
            Bloom Collective
          </h1>
          <p className="text-body text-muted-foreground text-lg leading-relaxed">
            A calm, supportive space for women building digital businesses. 
            Set your goals, track your progress, and grow together.
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Bloom Collective
            </h1>
          </div>

          <div className="card-elevated p-8">
            <h2 className="heading-section text-center mb-2">
              {isLogin ? 'Welcome back' : 'Join the collective'}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {isLogin 
                ? 'Sign in to continue your journey' 
                : 'Create your account to get started'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="label-text">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we call you?"
                    className="input-field"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="label-text">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label-text">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
