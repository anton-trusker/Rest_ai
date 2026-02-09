import { useState } from 'react';
import { mockUsers, MockUser } from '@/data/mockWines';
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
          <h1 className="text-3xl font-heading font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">{mockUsers.length} users</p>
        </div>
        <Button className="wine-gradient text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Create User
        </Button>
      </div>

      <div className="grid gap-4">
        {mockUsers.map(u => {
          const isActive = u.status === 'active';
          return (
            <div key={u.id} className="wine-glass-effect rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-lg font-heading font-semibold text-accent">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.name}</p>
                  <span className="wine-badge bg-secondary text-secondary-foreground">
                    {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                    {u.role}
                  </span>
                  {isActive ? (
                    <span className="wine-badge stock-healthy"><UserCheck className="w-3 h-3 mr-1" />Active</span>
                  ) : (
                    <span className="wine-badge stock-out"><UserX className="w-3 h-3 mr-1" />Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {u.totalCounts} inventory counts • Last login: {new Date(u.lastLogin).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-border">Edit</Button>
                <Button variant="outline" size="sm" className="border-border text-destructive hover:bg-destructive/10">
                  {isActive ? 'Suspend' : 'Activate'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
