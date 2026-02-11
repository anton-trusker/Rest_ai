import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/authStore';
import { ShieldCheck, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Label } from '@/core/ui/label';
import { toast } from 'sonner';
import loginHero from '@/assets/login-hero.jpg';

interface LoginProps {
    isAdminEntry?: boolean;
}

export default function Login({ isAdminEntry }: LoginProps) {
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const from = location.state?.from?.pathname;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { error: authError } = await login(email, password);
            if (authError) throw authError;

            // Wait for user to be loaded to check role
            const user = useAuthStore.getState().user;

            if (user?.permissions?.includes('*')) {
                // Super Admin redirect
                navigate('/super-admin/feature-flags');
                toast.success('Welcome, Super Admin');
            } else {
                // Standard redirect
                navigate(from || '/dashboard', { replace: true });
                toast.success('Welcome back');
            }
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || 'Invalid credentials');
            toast.error('Login failed');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            toast.error('Please enter your email first');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            toast.success('Password reset email sent');
        } catch (err: any) {
            toast.error(err.message || 'Failed to send reset email');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left: Hero image */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-start">
                {/* Use the existing hero image or a placeholder if it's missing */}
                <div className="absolute inset-0 bg-slate-900">
                    <img
                        src={loginHero}
                        alt="Elegant restaurant interior"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 p-12 pb-16 max-w-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">AI-Powered</span>
                    </div>
                    <h2 className="font-heading text-5xl font-bold text-white mb-3 leading-tight">Parra</h2>
                    <p className="text-lg text-white/70 leading-relaxed">
                        Smart restaurant management with AI-powered tools
                    </p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm animate-fade-in space-y-8">
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <h1 className="font-heading text-2xl font-bold">Parra {isAdminEntry && <span className="text-muted-foreground font-normal">Admin</span>}</h1>
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-heading text-3xl font-bold">{isAdminEntry ? 'System Access' : 'Welcome back'}</h2>
                        <p className="text-muted-foreground">{isAdminEntry ? 'Administrative Portal' : 'Sign in to your account to continue'}</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs text-primary cursor-pointer hover:underline bg-transparent border-0 p-0"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base"
                            disabled={isSubmitting || isLoading}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Sign in
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-xs text-muted-foreground text-center mt-8">
                        © {new Date().getFullYear()} Trusker Solutions · Protected by reCAPTCHA
                    </p>
                </div>
            </div>
        </div>
    );
}
