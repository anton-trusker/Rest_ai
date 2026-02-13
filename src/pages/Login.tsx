import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ShieldCheck, User, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';
import loginHero from '@/assets/login-hero.jpg';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginName, password);
    if (success) {
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid login name or password.",
      });
    }
  };

  // Demo helper to quick-fill
  const fillDemo = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setLoginName('admin');
      setPassword('admin123');
    } else {
      setLoginName('staff');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-end justify-start">
        <img
          src={loginHero}
          alt="Elegant restaurant interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative z-10 p-12 pb-16 max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-wine-gold" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-wine-gold">AI-Powered</span>
          </div>
          <h2 className="font-heading text-5xl font-bold text-white mb-3 leading-tight">Parra</h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Smart restaurant management with AI-powered tools
          </p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl wine-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Parra</h1>
          </div>

          <h2 className="font-heading text-3xl font-bold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginName">Login Name</Label>
              <Input
                id="loginName"
                type="text"
                placeholder="e.g. Manager"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
              disabled={loading}
              className="w-full h-11 wine-gradient text-primary-foreground font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Sign in
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-4">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => fillDemo('admin')}>
                Admin
              </Button>
              <Button variant="outline" size="sm" onClick={() => fillDemo('staff')}>
                Staff
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-10">
            © {new Date().getFullYear()} Trusker Solutions · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
