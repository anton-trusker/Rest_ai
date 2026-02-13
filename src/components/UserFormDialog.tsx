import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface UserFormDialogProps {
  user?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function UserFormDialog({ user, open, onClose, onSave }: UserFormDialogProps) {
  const { roles } = useSettingsStore();
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    loginName: '',
    password: '',
    roleId: '',
    status: 'active',
    phone: '',
    jobTitle: '',
    department: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: user?.name || user?.full_name || '',
        loginName: user?.loginName || user?.login_name || '',
        password: '',
        roleId: user?.roleId || user?.role_id || '',
        status: user?.status || (user?.is_active ? 'active' : 'inactive') || 'active',
        phone: user?.phone || '',
        jobTitle: user?.jobTitle || '',
        department: user?.department || '',
        notes: user?.notes || '',
      });
    }
  }, [user, open]);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name || !form.loginName) {
      toast.error('Name and Login Name are required');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required for new users');
      return;
    }
    if (!form.roleId) {
        toast.error('Role is required');
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: isEdit ? 'update' : 'create',
                payload: {
                    userId: user?.id,
                    loginName: form.loginName,
                    password: form.password,
                    roleId: form.roleId,
                    fullName: form.name,
                    // TODO: Handle other fields if backend supports them (phone, jobTitle, etc)
                    // Currently backend only updates loginName, roleId, fullName, password.
                    // We might need to extend profiles table for other fields or store in metadata?
                    // For now, let's stick to core fields.
                }
            }
        });

        if (error) {
             const body = await error.context?.json?.().catch(() => ({}));
             throw new Error(body.error || error.message);
        }

        toast.success(isEdit ? 'User updated' : 'User created');
        onSave?.();
        onClose();
    } catch (e: any) {
        console.error(e);
        toast.error('Failed: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this user?')) return;
      setLoading(true);
      try {
        const { error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'delete',
                payload: { userId: user?.id }
            }
        });

        if (error) {
             const body = await error.context?.json?.().catch(() => ({}));
             throw new Error(body.error || error.message);
        }

        toast.success('User deleted');
        onSave?.();
        onClose();
      } catch (e: any) {
        toast.error('Failed to delete: ' + e.message);
      } finally {
        setLoading(false);
      }
  };

  if (!open) return null;

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const pwColors = ['', 'bg-destructive', 'bg-wine-warning', 'bg-wine-success'];
  const pwLabels = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading text-xl font-semibold">{isEdit ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-secondary border-border" /></div>
            <div className="space-y-1.5"><Label>Login Name *</Label><Input value={form.loginName} onChange={e => update('loginName', e.target.value)} className="bg-secondary border-border" placeholder="e.g. Manager" /></div>
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
            <Input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="bg-secondary border-border" />
            {form.password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pwStrength ? pwColors[pwStrength] : 'bg-secondary'}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{pwLabels[pwStrength]}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={v => update('roleId', v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status is not editable via this dialog yet because backend function doesn't support it explicitly, but let's keep UI */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)} disabled>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional fields - UI only for now as backend needs update to store them */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-50 pointer-events-none">
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="bg-secondary border-border" /></div>
            <div className="space-y-1.5"><Label>Job Title</Label><Input value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} className="bg-secondary border-border" /></div>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border">
          {isEdit ? (
            <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-1" />} Delete User
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-border" disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} className="wine-gradient text-primary-foreground hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
