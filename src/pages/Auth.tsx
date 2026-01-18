import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/accountability-circle-logo.png';
export default function Auth() {
  const {
    user,
    loading,
    signIn
  } = useAuth();
  const {
    toast
  } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background flex">
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
              Welcome back
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Sign in to continue your journey
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="label-text">
                  Email address
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" required />
              </div>

              <div>
                <label htmlFor="password" className="label-text">
                  Password
                </label>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" required minLength={6} />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Sign in
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/apply" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Want to join? Apply here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>;
}