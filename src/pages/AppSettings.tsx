import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Settings, Database, Bell, Shield } from 'lucide-react';

export default function AppSettings() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const sections = [
    { icon: Database, title: 'Database', desc: 'Manage wine catalog backups and data import/export' },
    { icon: Bell, title: 'Notifications', desc: 'Configure low stock alerts and notification preferences' },
    { icon: Shield, title: 'Security', desc: 'Password policies, session timeouts, and access controls' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-heading font-bold">Settings</h1>
      <div className="space-y-4">
        {sections.map(s => (
          <div key={s.title} className="wine-glass-effect rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-wine-gold/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center">
              <s.icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
