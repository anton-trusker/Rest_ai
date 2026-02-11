
import { useState, useEffect } from 'react';
import { supabase } from '@/core/lib/supabase/client';
import { Search, Plus, Filter, MoreVertical, Shield, Mail, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/core/ui/dropdown-menu';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { useAuthStore } from '@/core/auth/authStore';
import { toast } from 'sonner';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  is_active: boolean;
  role: string;
  last_sign_in_at?: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles + roles (joining tables)
      // Note: Since auth.users is protected, we rely on profiles table (which mirrors it via trigger ideally, 
      // but for now we seeded/created profiles manually via admin function).
      // We need to fetch profiles and join with user_roles -> roles

      const { data, error } = await supabase
        .from('profiles')
        .select(`
                    id, full_name, avatar_url, is_active,
                    user_roles (
                        roles ( name, display_name )
                    )
                `);

      if (error) throw error;

      // Map to flat structure
      const mappedUsers = data.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: 'hidden@email.com', // Profiles usually don't expose email publicly for privacy, need admin function to list emails or store in profile
        avatar_url: p.avatar_url,
        is_active: p.is_active,
        role: p.user_roles?.[0]?.roles?.display_name || 'No Role',
        last_sign_in_at: new Date().toISOString() // Placeholder or fetch from audit logs
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage team access and permissions</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="wine-gradient text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        {/* Additional filters can be re-added here */}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="wine-glass-effect rounded-xl p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold bg-secondary text-muted-foreground`}>
                {user.full_name?.charAt(0) || '?'}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold truncate flex items-center gap-2">
                    {user.full_name || 'Unknown'}
                    {user.id === currentUser?.id && <span className="text-[10px] bg-accent/20 text-accent px-1.5 rounded-full">You</span>}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-secondary text-muted-foreground border-border">
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role}
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${user.is_active ? 'bg-wine-success/10 text-wine-success border-wine-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {user.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {user.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 text-sm text-muted-foreground">
                  <div className="text-right">
                    <p className="text-xs">Last Action</p>
                    <p className="font-medium text-foreground">Recently</p>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit User</DropdownMenuItem>
                  <DropdownMenuItem>Reset Password</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )
      }

      <CreateUserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchUsers}
      />
    </div >
  );
}
