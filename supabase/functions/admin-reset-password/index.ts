
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const authHeader = req.headers.get('Authorization')!
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user: caller }, error: authError } = await supabase.auth.getUser()
        if (authError || !caller) throw new Error('Unauthorized')

        // Check if caller is admin/super_admin
        const { data: roles } = await supabaseAdmin
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', caller.id)

        const isAdmin = roles?.some((r: { roles: { name: string } }) => ['super_admin', 'admin'].includes(r.roles.name))
        if (!isAdmin) throw new Error('Forbidden: Admin access only')

        const { userId, newPassword } = await req.json()

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
        if (updateError) throw updateError

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            user_id: caller.id,
            action: 'reset_password',
            entity_type: 'user',
            entity_id: userId,
            ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        })

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        })
    }
})
