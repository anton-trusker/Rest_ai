import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Wine, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = login(email, password);
    setLoading(false);
    if (success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 wine-gradient relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(350_55%_38%_/_0.4),transparent_60%)]" />
        <div className="relative z-10 text-center px-12">
          <Wine className="w-20 h-20 mx-auto mb-6 text-wine-gold opacity-80" />
          <h2 className="font-heading text-5xl font-bold text-wine-cream mb-4">Cellar</h2>
          <p className="text-lg text-wine-cream/70 max-w-md">
            Smart wine inventory management with AI-powered recognition
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/30 to-transparent" />
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl wine-gradient flex items-center justify-center">
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Cellar</h1>
          </div>

          <h2 className="font-heading text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to manage your wine inventory</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@wine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-card border-border pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 wine-gradient text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 p-4 rounded-lg bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-2">Demo Credentials:</p>
            <p className="text-xs text-foreground">Admin: admin@wine.com / admin123</p>
            <p className="text-xs text-foreground">Staff: staff@wine.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
