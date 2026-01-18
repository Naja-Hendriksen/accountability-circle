import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/accountability-circle-logo.png';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
      if (isSignUp) {
        // Check if email is in approved applications
        const { data: application, error: appError } = await supabase
          .from('applications')
          .select('id, first_name, last_name, status')
          .eq('email', email.toLowerCase().trim())
          .eq('status', 'approved')
          .maybeSingle();

        if (appError) throw appError;

        if (!application) {
          throw new Error('This email is not approved for sign-up. Please apply first or wait for approval.');
        }

        // Use name from application if not provided
        const fullName = name.trim() || `${application.first_name} ${application.last_name}`.trim();
        
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        
        // Switch to sign-in mode
        setIsSignUp(false);
        setPassword('');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden mb-8">
            <img src={logo} alt="Accountability Circle" className="w-full h-full object-cover" />
          </div>
          <h1 className="heading-display text-foreground mb-6">
            Accountability Circle
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full overflow-hidden mb-4">
              <img src={logo} alt="Accountability Circle" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">Accountability Circle</h1>
          </div>

          <div className="card-elevated p-8">
            <h2 className="heading-section text-center mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {isSignUp 
                ? 'Sign up with your approved email' 
                : 'Sign in to continue your journey'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="label-text">
                    Full name (optional)
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-field"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave blank to use the name from your application
                  </p>
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
                {isSignUp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Must match your approved application email
                  </p>
                )}
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
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setPassword('');
                }}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : 'Approved member? Create account'}
              </button>
              
              {!isSignUp && (
                <div>
                  <Link to="/apply" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Want to join? Apply here
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}