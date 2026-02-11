
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

console.log('Hello from admin-create-user!')

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Create Supabase client (Admin Context)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 2. Create Supabase client (User Context - to verify caller)
        const authHeader = req.headers.get('Authorization')!
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        // 3. Verify Caller
        const { data: { user: caller }, error: authError } = await supabase.auth.getUser()
        if (authError || !caller) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Verify Caller Role (Must be Admin or Super Admin)
        const { data: callerRoles, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('roles(name, hierarchy_level)')
            .eq('user_id', caller.id)

        if (roleError || !callerRoles) {
            return new Response(JSON.stringify({ error: 'Failed to fetch roles' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const hasAdminAccess = callerRoles.some((ur: any) =>
            ['super_admin', 'admin'].includes(ur.roles.name)
        )

        if (!hasAdminAccess) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access only' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 5. Parse Request Body
        const { email, password, fullName, roleId, locationIds } = await req.json()

        // 6. Create User in Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        })

        if (createError) throw createError
        if (!newUser.user) throw new Error('User creation failed')

        // 7. Insert Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                full_name: fullName,
                is_active: true
            })

        if (profileError) throw profileError

        // 8. Assign Role
        const { error: roleAssignError } = await supabaseAdmin
            .from('user_roles')
            .insert({
                user_id: newUser.user.id,
                role_id: roleId,
                assigned_by: caller.id
            })

        if (roleAssignError) throw roleAssignError

        // 9. Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: caller.id,
            action: 'create_user',
            entity_type: 'user',
            entity_id: newUser.user.id,
            new_values: { email, roleId, fullName },
            ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        })

        return new Response(JSON.stringify({ user: newUser.user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
