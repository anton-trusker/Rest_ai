import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHasPermission } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ALL_MODULES,
  ALL_PERMISSION_LEVELS,
  type AppRole,
  type ModuleKey,
  type PermissionLevel,
} from '@/data/referenceData';

export default function RolesPermissions() {
  const canAccess = useHasPermission('settings', 'full');
  const { roles, addRole, removeRole, setRolePermission, updateRole } = useSettingsStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('hsl(150, 50%, 45%)');

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Enter a role name'); return; }
    const defaultPerms: Record<ModuleKey, PermissionLevel> = {} as any;
    ALL_MODULES.forEach((m) => { defaultPerms[m.key] = 'none'; });
    defaultPerms.dashboard = 'view';

    const newRole: AppRole = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      isBuiltin: false,
      permissions: defaultPerms,
    };
    addRole(newRole);
    setNewRoleName('');
    toast.success(`Role "${newRole.name}" created`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">Roles & Permissions</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Roles & Permissions</h1>
      </div>

      {/* Add new role */}
      <div className="wine-glass-effect rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-lg">Create New Role</h3>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Role Name</Label>
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Sommelier"
              className="bg-secondary border-border w-44"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={newRoleColor.startsWith('hsl') ? '#22c55e' : newRoleColor}
              onChange={(e) => setNewRoleColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-secondary"
            />
          </div>
          <Button size="sm" onClick={handleAddRole} className="wine-gradient text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Role
          </Button>
        </div>
      </div>

      {/* Roles list with permission matrices */}
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="wine-glass-effect rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <h3 className="font-heading font-semibold text-lg">{role.name}</h3>
                {role.isBuiltin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    Built-in
                  </span>
                )}
              </div>
              {!role.isBuiltin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { removeRole(role.id); toast.success('Role deleted'); }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>

            {/* Permission grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Module</th>
                    {ALL_PERMISSION_LEVELS.map((l) => (
                      <th key={l.value} className="text-center py-2 px-2 text-xs text-muted-foreground font-medium w-16">
                        {l.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_MODULES.map((m) => (
                    <tr key={m.key} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-sm">{m.label}</td>
                      {ALL_PERMISSION_LEVELS.map((l) => (
                        <td key={l.value} className="text-center py-2 px-2">
                          <button
                            onClick={() => setRolePermission(role.id, m.key, l.value)}
                            disabled={role.isBuiltin && role.id === 'role_admin'}
                            className={`w-5 h-5 rounded-full border-2 transition-colors mx-auto flex items-center justify-center ${
                              role.permissions[m.key] === l.value
                                ? 'border-accent bg-accent'
                                : 'border-border hover:border-muted-foreground'
                            } ${role.isBuiltin && role.id === 'role_admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {role.permissions[m.key] === l.value && (
                              <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
