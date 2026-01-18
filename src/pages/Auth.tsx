import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2, UserPlus, LogIn, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/accountability-circle-logo.png';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [accessError, setAccessError] = useState<string | null>(null);

  // Password validation
  const passwordChecks = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  };
  const allPasswordChecksPassed = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
    setAccessError(null);

    try {
      if (isSignUp) {
        // Validate password requirements
        if (!allPasswordChecksPassed) {
          toast({
            title: "Password requirements not met",
            description: "Please ensure your password meets all requirements.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        if (!passwordsMatch) {
          toast({
            title: "Passwords don't match",
            description: "Please make sure both passwords are identical.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }

        // Check if email is in approved applications
        // Check if email is in approved applications
        const { data: application, error: appError } = await supabase
          .from('applications')
          .select('id, first_name, last_name, status')
          .eq('email', email.toLowerCase().trim())
          .eq('status', 'approved')
          .maybeSingle();

        if (appError) throw appError;

        if (!application) {
          setAccessError('This email has not been granted access to the group. Please use the email you applied with, or apply below to become a member.');
          setSubmitting(false);
          return;
        }

        // Use name from approved application
        const fullName = `${application.first_name} ${application.last_name}`.trim();
        
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now sign in with your credentials.",
        });
        
        // Switch to sign-in mode
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
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

          {/* Mode Toggle Tabs */}
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setPassword('');
                setConfirmPassword('');
                setAccessError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                !isSignUp 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setPassword('');
                setConfirmPassword('');
                setAccessError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                isSignUp 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Create Account
            </button>
          </div>

          <div className="card-elevated p-8">
            <h2 className="heading-section text-center mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              {isSignUp 
                ? 'Use your approved application email' 
                : 'Sign in to continue your journey'}
            </p>

            {isSignUp && accessError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground font-medium mb-1">Access Not Granted</p>
                    <p className="text-sm text-muted-foreground">{accessError}</p>
                    <Link 
                      to="/apply" 
                      className="inline-block mt-2 text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Apply to become a member →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isSignUp && !accessError && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-foreground">
                  <strong>First time here?</strong> Create your account using the same email address from your approved application.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  minLength={isSignUp ? 8 : 6}
                />
                
                {/* Password requirements checklist */}
                {isSignUp && password.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <PasswordCheck passed={passwordChecks.minLength} label="At least 8 characters" />
                    <PasswordCheck passed={passwordChecks.hasUppercase} label="One uppercase letter" />
                    <PasswordCheck passed={passwordChecks.hasLowercase} label="One lowercase letter" />
                    <PasswordCheck passed={passwordChecks.hasNumber} label="One number" />
                  </div>
                )}
              </div>

              {/* Confirm password field for signup */}
              {isSignUp && (
                <div>
                  <label htmlFor="confirmPassword" className="label-text">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`input-field ${confirmPassword.length > 0 && !passwordsMatch ? 'border-destructive focus:ring-destructive' : ''}`}
                    required
                  />
                  {confirmPassword.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      {passwordsMatch ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-destructive" />
                          <span className="text-xs text-destructive">Passwords don't match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (isSignUp && (!allPasswordChecksPassed || !passwordsMatch))}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/apply" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Want to join? Apply here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for password requirements
function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={`text-xs ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}