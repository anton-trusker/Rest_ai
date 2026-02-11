import { useState } from 'react';
import { useSettingsStore } from '@/core/settings/settingsStore';
import { useHasPermission } from '@/core/auth/authStore';
import { ALL_MODULES, permKey } from '@/core/lib/referenceData';
import { Button } from '@/core/ui/button';
import { Input } from '@/core/ui/input';
import { Label } from '@/core/ui/label';
import { Checkbox } from '@/core/ui/checkbox';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/core/ui/dropdown-menu';
import { Plus, MoreVertical, Shield, Globe, Lock, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RolesPermissions() {
    const { roles, updateRolePermissions } = useSettingsStore();
    const canManageRoles = useHasPermission('settings', 'edit');

    const [selectedroleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
    const [editingRole, setEditingRole] = useState<string | null>(null);

    const activeRole = roles.find(r => r.id === selectedroleId);

    const togglePermission = (moduleKey: string, actionKey: string, checked: boolean) => {
        if (!activeRole) return;
        updateRolePermissions(activeRole.id, moduleKey, actionKey, checked);
    };

    const handleCreateRole = () => {
        toast.info('Create role feature coming soon');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-heading font-bold">Roles & Permissions</h1>
                <p className="text-muted-foreground mt-1">Configure access levels for each role</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                {/* Roles Sidebar */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Roles</h3>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCreateRole}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border
                  ${selectedroleId === role.id
                                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                                        : 'bg-card border-border hover:bg-secondary/50'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                                    style={{ backgroundColor: role.color + '20', color: role.color }}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`font-semibold ${selectedroleId === role.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {role.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                                </div>
                                {selectedroleId === role.id && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    {activeRole ? (
                        <>
                            {/* Header */}
                            <div className="p-6 border-b border-border bg-secondary/20">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold font-heading">{activeRole.name}</h2>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                                                {activeRole.isSystem ? 'System Role' : 'Custom Role'}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground">{activeRole.description}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem disabled={activeRole.isSystem}>
                                                <Edit2 className="w-4 h-4 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" disabled={activeRole.isSystem}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Matrix */}
                            <div className="divide-y divide-border">
                                {ALL_MODULES.map(module => (
                                    <div key={module.key} className="p-6 hover:bg-muted/10 transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-12">
                                            <div className="sm:w-48 shrink-0">
                                                <h4 className="font-semibold text-foreground mb-1">{module.label}</h4>
                                                <p className="text-xs text-muted-foreground">Access settings for {module.label.toLowerCase()} module</p>
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {/* Global View/Edit per module if applicable, or specific sub-actions */}
                                                {module.subActions.map(action => {
                                                    const pKey = permKey(module.key, action.key);
                                                    const isEnabled = activeRole.permissions.includes(pKey);

                                                    // Admin bypass visual
                                                    const isAdmin = activeRole.id === 'role_admin';

                                                    return (
                                                        <label key={action.key} className={`flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer
                              ${isEnabled
                                                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                                                : 'bg-transparent border-transparent hover:bg-secondary'
                                                            }
                              ${isAdmin ? 'opacity-70 cursor-not-allowed' : ''}
                            `}>
                                                            <Checkbox
                                                                checked={isEnabled || isAdmin}
                                                                onCheckedChange={(c) => !isAdmin && togglePermission(module.key, action.key, c as boolean)}
                                                                disabled={isAdmin}
                                                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                            />
                                                            <div className="flex-1">
                                                                <span className={`text-sm font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                    {action.label}
                                                                </span>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <Shield className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a role to configure permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
