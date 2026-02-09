import { mockUsers } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Plus, UserCheck, UserX, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UserManagement() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">{mockUsers.length} users</p>
        </div>
        <Button size="sm" className="wine-gradient text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Create User
        </Button>
      </div>

      <div className="grid gap-3">
        {mockUsers.map(u => {
          const isActive = u.status === 'active';
          return (
            <div key={u.id} className="wine-glass-effect rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-base font-heading font-semibold text-accent">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{u.name}</p>
                    <span className="wine-badge bg-secondary text-secondary-foreground text-[10px]">
                      {u.role === 'admin' ? <Shield className="w-3 h-3 mr-0.5" /> : <User className="w-3 h-3 mr-0.5" />}
                      {u.role}
                    </span>
                    {isActive ? (
                      <span className="wine-badge stock-healthy text-[10px]"><UserCheck className="w-3 h-3 mr-0.5" />Active</span>
                    ) : (
                      <span className="wine-badge stock-out text-[10px]"><UserX className="w-3 h-3 mr-0.5" />Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {u.totalCounts} counts • Last login: {new Date(u.lastLogin).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="border-border h-8 text-xs">Edit</Button>
                    <Button variant="outline" size="sm" className="border-border h-8 text-xs text-destructive hover:bg-destructive/10">
                      {isActive ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
